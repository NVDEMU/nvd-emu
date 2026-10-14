# nvd-emu

**A multi-system emulator for Windows and macOS (Apple Silicon).**

nvd-emu is intended to provide one native-feeling desktop application for organizing and launching games across multiple supported systems. System emulation is provided by isolated, versioned core modules rather than hard-coding every console into the frontend.

> **Development status:** Early scaffold. The frontend and core interfaces are being established; no console is advertised as playable until a real core is integrated and tested.

## Goals

- Windows x64 and macOS arm64 builds.
- A game library that scans user-selected folders without modifying game files.
- Extensible system-core interface with explicit compatibility reporting.
- Controller configuration, save states, video/audio settings, and per-game options as the runtime matures.
- Automated CI builds and downloadable Nightly/Stable releases.
- Use legally obtained game dumps and required system firmware.

## Project layout

```
nvd-emu/
├── CMakeLists.txt
├── src/                 # Desktop frontend and application entry point
├── include/nvd/         # Public core/runtime interfaces
├── resources/           # Branding and application resources
├── tests/               # Unit tests
└── .github/workflows/   # Cross-platform CI and release automation
```

## Build prerequisites

- CMake 3.24+
- C++20 compiler
- Qt 6.7+ (Widgets, Multimedia)
- Git

Typical local build:

```sh
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

The exact Qt deployment and packaging steps are handled by the GitHub Actions workflow.

## macOS downloads and Gatekeeper

macOS release downloads require a Developer ID Application certificate and successful Apple notarization. Until these repository secrets are configured, CI keeps macOS builds as short-lived artifacts and does not publish a public Mac DMG/ZIP that Gatekeeper may block. See [the macOS signing guide](docs/macos-signing.md) for GUI-based certificate setup, GitHub Secrets, and a local-only Base64 helper. Windows release builds continue normally.

## Development principles

1. Keep the frontend separate from emulation engines.
2. Prefer mature, actively maintained cores where licensing permits instead of claiming to reimplement whole consoles prematurely.
3. Clearly distinguish detected, booting, in-game, and playable compatibility.
4. Never bundle copyrighted games, console firmware, keys, or proprietary BIOS files.

## License

License selection is pending. Before bundling or redistributing any third-party emulation core, verify its license and redistribution requirements.
