# macOS signing and notarization

The macOS build must be signed with a **Developer ID Application** certificate and notarized by Apple before it is published as a normal release download. An ad-hoc signature (the fallback used for CI preview artifacts) is not a substitute for Developer ID signing or notarization.

Apple's official requirements:
- [Safely open apps on your Mac](https://support.apple.com/en-us/102445)
- [Signing Mac software with Developer ID](https://developer.apple.com/developer-id/)
- [Notarizing macOS software before distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)

## Required account setup

The account holder needs an Apple Developer Program membership and a **Developer ID Application** certificate with its private key. Do not paste any certificate, private key, app-specific password, or secret into an issue or chat.

## Create the signing certificate without Terminal

1. Open **Keychain Access** on a Mac.
2. From the **Keychain Access** menu, choose **Certificate Assistant → Request a Certificate From a Certificate Authority**. Save the CSR to disk.
3. In the Apple Developer website, open **Certificates, Identifiers & Profiles**, create a **Developer ID Application** certificate using that CSR, download the certificate, and open it to add it to Keychain Access.
4. In Keychain Access, find the Developer ID Application certificate and confirm that its private key is nested beneath it.
5. Select the certificate and its private key, then export them as a password-protected **.p12** file. Keep the .p12 private and never commit it to the repository.
6. Create an app-specific password for the Apple Account used for notarization and find the team's **Team ID** in the Apple Developer account.

## Convert the .p12 to a GitHub secret without Terminal

Use the local-only helper at [tools/p12-to-base64.html](tools/p12-to-base64.html). Download the HTML file from this repository and open it in a browser on your own computer. Select the .p12 file and encode it. The helper runs locally: it has no external scripts, makes no network requests, and does not upload the file. Copy the output directly into GitHub Actions secrets. Do not use a third-party online encoding website for a private signing certificate.

## Add repository secrets

In the repository on GitHub, go to **Settings → Secrets and variables → Actions → New repository secret** and add the following secrets exactly as named:

| Secret name | Value |
| --- | --- |
| `APPLE_CERTIFICATE_P12_BASE64` | Full Base64 output from the local helper |
| `APPLE_CERTIFICATE_PASSWORD` | Password used to export the .p12 |
| `APPLE_ID` | Apple Account email used for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | Apple app-specific password |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

Never include these values in commits, workflow logs, or pull requests.

## Release behavior

The GitHub Actions workflow imports the certificate into a temporary keychain, signs with the hardened runtime and secure timestamp, submits the app and disk image to Apple's notary service, staples and validates the tickets, and verifies the resulting app before publishing.

Until all five secrets are configured, the workflow only builds an unsigned-for-distribution macOS preview artifact. It does **not** publish it as a macOS release asset, and removes stale unnotarized macOS downloads from the Nightly release so users do not repeatedly download a package that Gatekeeper may block. Windows builds continue to publish normally.
