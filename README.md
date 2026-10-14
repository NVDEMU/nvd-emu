# nvd-emu

**A multi-system emulator project for Windows, macOS Apple Silicon, and the browser.**

The native Qt/C++ desktop frontend is an early foundation. For an immediately usable, no-Terminal route on macOS, the repository is also adding **nvd-emu Web**, a browser edition that can load a user's own game file locally and run it through EmulatorJS cores.

## Play without installing a Mac app

The browser edition lives in [`docs/`](docs/). One-time setup is required: open [Settings → Pages](https://github.com/NVDEMU/nvd-emu/settings/pages), set **Build and deployment → Source** to **GitHub Actions**, and save. The [Pages workflow](.github/workflows/pages.yml) then deploys the site automatically to [https://nvdemu.github.io/nvd-emu/](https://nvdemu.github.io/nvd-emu/). Open it in Safari, Chrome, or Edge. On macOS Safari, use File → Add to Dock to make it act like an app; there is no Terminal, DMG, or Gatekeeper dialog.

**First system: Atari 2600.** The web frontend loads the Stella 2014 core via EmulatorJS and includes an original in-memory color-cycle diagnostic cartridge, so you can test the CPU/TIA path without supplying a game ROM. The selector also wires NES, Game Boy/Color, Game Boy Advance, SNES, Sega Master System, and Mega Drive/Genesis. These mappings are a starting compatibility surface, not a claim that every commercial ROM has been tested.

The browser downloads the emulator engine from the EmulatorJS stable CDN when you start a game. Your selected ROM is held in a local browser object URL and is not uploaded by this page. An internet connection is required to fetch the engine. Game ROMs are not included; use files you are legally entitled to use.

## Native desktop frontend

- C++20 and Qt 6
- Windows x64 and macOS arm64 build jobs
- Library scanning and a versioned core-plugin interface
- Release automation in [`.github/workflows/build.yml`](.github/workflows/build.yml)

No native system core has been fully integrated into the Qt runtime yet. The browser edition is the first playable route while the native application matures.

## Why CI artifacts expire

GitHub Actions **artifacts** are temporary build outputs retained for a limited period (the workflow currently uses 7 days). They're for checking a build or passing outputs between jobs. **Release assets** attached to a GitHub Release are the normal public downloads. The project no longer intends to publish unsigned/unnotarized macOS packages as release assets because Gatekeeper blocks them.

## macOS signing / notarization

Apple's Developer ID distribution path requires an Apple Developer Program membership, currently US$99 per year. Without those credentials, there is no honest way to make this native app a standard notarized Mac download. See [the setup guide](docs/macos-signing.md). For now, use the browser edition rather than disabling Mac security.

## Architecture and dependencies

- Native UI: Qt 6 / C++20.
- Web frontend: static HTML, CSS, and JavaScript.
- Browser emulator engines: [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) (GPL-3.0); Atari 2600 uses its published Stella 2014 core (GPLv2). The browser page currently loads those engine assets from the upstream stable CDN rather than bundling them locally. Consult upstream license terms before redistributing modified or self-hosted core assets.
- No copyrighted game ROMs, console firmware, or BIOS files are included.

See [macOS signing docs](docs/macos-signing.md) and the [web app source](docs/index.html).
