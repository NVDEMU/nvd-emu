# nvd-emu

**A multi-system emulator project for Windows, macOS Apple Silicon, and the browser.**

The native Qt/C++ desktop frontend is an early foundation. For a no-Terminal route on macOS, **nvd-emu Web** is a browser edition that loads a user's own game file locally and runs supported retro systems through EmulatorJS cores.

## Play without installing a Mac app

The browser edition lives in [`docs/`](docs/). For the simplest GitHub Pages setup, open [Settings → Pages](https://github.com/NVDEMU/nvd-emu/settings/pages) and set **Build and deployment → Source** to **Deploy from a branch**, branch **main**, folder **/(root)**, then save. The root `index.html` redirects into the actual browser app at [https://nvdemu.github.io/nvd-emu/docs/](https://nvdemu.github.io/nvd-emu/docs/). The Pages workflow validates the web code; GitHub Pages publishes the root branch automatically. Open it in Safari, Chrome, or Edge. On macOS Safari, use File → Add to Dock to make it act like an app; there is no Terminal, DMG, or Gatekeeper dialog.

**22 browser systems are configured:** Atari 2600/7800/Lynx, NES, SNES, Game Boy/Color, Game Boy Advance, Nintendo 64/DS, PlayStation/PSP, Sega Master System, Game Gear, Mega Drive/Genesis, Sega CD, 32X, Saturn, Dreamcast, Virtual Boy, PC Engine/TurboGrafx-16, WonderSwan/Color, and FinalBurn Neo arcade. The system and game-library cards use distinct console-themed iconography. The game library stores selected game files in browser IndexedDB, restores them after reopening the tab, and provides a per-game remove control; storage availability and quota depend on the browser. Removing a game only removes nvd-emu's local library copy, not the original file on disk. EmulatorJS provides the corresponding browser cores; the selector, system cards, file-extension checks, and compatibility list use one shared catalogue. The original in-memory Atari 2600 color-cycle diagnostic cartridge remains available to smoke-test without a game ROM. The player toolbar exposes controller remapping, save/load states, quick-save/quick-load, and game-save import/export. For PS1, PCSX-ReARMed is configured with DualShock analog input and an HLE BIOS fallback; you may optionally choose your own compatible BIOS file locally for games that need it. No BIOS is bundled, and BIOS-free compatibility varies by game and region. These mappings are a starting compatibility surface, not a claim that every commercial ROM has been tested. GameCube/Wii remain under separate WebAssembly feasibility research; see [the roadmap](docs/roadmap/gamecube-wii-wasm.md).

The browser downloads the emulator engine from the EmulatorJS stable CDN when you start a game. Your selected ROM is held in a local browser object URL and is not uploaded by this page. An internet connection is required to fetch the engine. Game ROMs and console BIOS files are not included; use files you are legally entitled to use.

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
