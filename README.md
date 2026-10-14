# nvd-emu

**A browser-first retro gaming frontend.** NVD-EMU is a multi-page web app for browsing your personal ROM library, discovering supported systems, and launching games through EmulatorJS cores.

## Open the app

The public site is hosted with GitHub Pages:

- **[Open NVD-EMU](https://nvdemu.github.io/nvd-emu/docs/)**
- [Game library](https://nvdemu.github.io/nvd-emu/docs/library.html) — local ROM storage, game cover lookup, play and remove controls.
- [Systems catalogue](https://nvdemu.github.io/nvd-emu/docs/systems.html) — searchable, alphabetically ordered console and computer catalogue.
- [Player](https://nvdemu.github.io/nvd-emu/docs/player.html) — dedicated game launcher with keyboard/controller settings, save states and fullscreen.
- [Settings](https://nvdemu.github.io/nvd-emu/docs/settings.html) — browser storage usage and persistent-storage controls.
- [Source code](https://github.com/NVDEMU/nvd-emu/tree/main/docs).

If the site is not published yet, go to [GitHub Pages settings](https://github.com/NVDEMU/nvd-emu/settings/pages) and set **Build and deployment → Source** to **Deploy from a branch**, branch **main**, folder **/(root)**. The root entry redirects visitors to the web app under \`/docs/\`. The Actions workflow checks the app scripts and required assets on changes.

## Browser systems

NVD-EMU has **40 system profiles configured** across Atari, Nintendo, PlayStation, Sega, arcade, NEC, Coleco, Commodore and other retro platforms. The catalogue includes NES/Famicom and Famicom Disk System, SNES, Game Boy/Game Boy Color, Game Boy Advance, Virtual Boy, Nintendo 64 and DS, Atari 2600/5200/7800/Lynx/Jaguar, PlayStation, PSP, Sega Master System/Game Gear/Mega Drive/Sega CD/32X/Saturn/Dreamcast, PC Engine/SuperGrafx, WonderSwan, ColecoVision, Commodore 64/128/PET/Plus/4/VIC-20/Amiga, Neo Geo Pocket/Color, PC-FX, 3DO, MS-DOS, FinalBurn Neo and MAME 2003 profiles.

System cards use console/company artwork and local SVG logos or custom logos for brands without a dependable image source. Game cover art is searched by ROM filename in the [Libretro thumbnails collection](https://github.com/libretro-thumbnails/libretro-thumbnails). Files with well-known names have the best chance of matching; if a cover cannot be found, the library uses a game-title card instead of showing the console logo as fake game art.

This catalogue describes configured targets, **not a guarantee that every system or game has been successfully tested**. Unsupported/experimental systems are separated on the Systems page rather than quietly mapping them to a different console core.

## Browser storage and privacy

- Selected ROM data is saved in the browser's IndexedDB library, so the library can be restored after closing and reopening the tab.
- NVD-EMU requests persistent browser storage when available. Browser eviction, privacy modes, manually clearing site data and storage quotas can still affect availability.
- Your ROMs and BIOS files are not uploaded to this repository or a NVD-EMU game server. Browser emulation cores are loaded on demand from the EmulatorJS CDN, and artwork is retrieved from its external source.
- Game files, BIOS/firmware dumps and commercial artwork are not bundled in this repository. Use games and firmware you are legally entitled to use.
- Remove a library entry from NVD-EMU to remove its saved local copy; this does not delete your original file elsewhere on the device.

## 3DS in the browser · experimental

NVD-EMU includes an experimental Nintendo 3DS profile using the Azahar core exposed by EmulatorJS's **nightly** data channel. It enables EmulatorJS threading and includes a service-worker workaround for the cross-origin isolation headers needed by \`SharedArrayBuffer\` on static hosting.

This is an early experiment, not a promise of playable compatibility. It requires a supported browser/device and working cross-origin isolation. GitHub Pages service-worker header shims may behave differently across browsers and browser settings, and the core may change in nightly builds. The app checks isolation before starting a 3DS game and displays an error when the browser has not enabled it. No “first ever” claim is made: the goal is to make a 3DS browser experience that's convenient, honest about compatibility, and easy to test.

## Browser engine and controls

NVD-EMU is static HTML, CSS and JavaScript. [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) supplies the WebAssembly emulation cores. The game player exposes the EmulatorJS toolbar for controller mapping, save/load states, quick save/load, screenshots, audio and fullscreen where supported. The PlayStation profile requests DualShock input and allows an optional BIOS file from the user.

GameCube and Wii are not integrated playable systems. See the [browser feasibility roadmap](docs/roadmap/gamecube-wii-wasm.md) for why a full Dolphin-derived browser port needs separate engineering and performance testing.

## Project scope

This repository is intentionally **browser-only**. CI validates the web app, its separate pages, browser-storage helper, artwork, system catalogue and threading bootstrap; it does not build or release a native Qt/C++ desktop app.
