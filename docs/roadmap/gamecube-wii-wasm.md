# GameCube and Wii in nvd-emu Web: feasibility plan

## Is browser emulation possible?

Yes. WebAssembly (WASM), WebGPU/WebGL, browser audio, the Gamepad API, and local file APIs make it technically possible to build a GameCube/Wii player for modern desktop browsers. The hard part is not displaying a webpage: it is delivering an accurate, sufficiently fast CPU recompiler, GPU renderer, audio/DSP timing, input and (for Wii) motion/pointer behavior, plus persistent save data.

This repository's current web engine, EmulatorJS, is designed for much lighter retro systems. Its core guide lists its supported cores and marks Dolphin as unavailable; a GameCube/Wii core should not be implied by a selector entry alone.

## Candidates evaluated

### 1. RetroArch / Libretro Dolphin core

The ordinary Dolphin Libretro core is a native C++ core that expects desktop graphics backends such as OpenGL, Vulkan or Direct3D 11 and a Dolphin `Sys` directory. It is not a ready-made browser/WebAssembly package that nvd-emu can simply load. Libretro's core documentation currently lists Dolphin among unavailable web cores and warns about extremely poor performance in that environment.

**Conclusion:** do not add `dolphin` as an EmulatorJS system id or expect the desktop RetroArch core download to work in a webpage. A browser port needs a separate, intentionally built WASM target and a graphics/input integration layer.

### 2. Experimental `wasm-dolphin` port

Repository: https://github.com/dougchansan/wasm-dolphin

This is a concrete browser-oriented Dolphin-derived experiment and is worth a reproducible build/test before writing another port from scratch. Its July 2026 performance audit reports that one measured Melee scene reached approximately 95–97% emulation speed with the software renderer, but only about 10.7 distinct visual frames per second. The same audit says the experimental hardware-WebGPU route displayed a diagnostic pattern rather than a valid game frame, with no real presentation/audio output. Its own audit also calls out incomplete source/patch provenance.

**Conclusion:** promising as a GameCube proof-of-concept, not production-ready. Before integrating, pin a reproducible source commit, reproduce its browser build, verify the source/license/patch chain, measure frame pacing and audio, test actual game input, and establish Wii-game support separately.

### 3. Gecko's browser/WebAssembly target

Repository: https://github.com/Torashi1069/emu.nintendo.wii.gecko

Gecko is an experimental Rust GameCube/Wii emulator with a `wasm-bindgen` browser target. Its current project documentation lists ISO/RVZ support and Wii features for the emulator, but that does not prove those paths are all exposed by its web frontend. The public browser demo currently asks for a GameCube IPL/DOL file and optional DSP IROM; it does not expose the same complete retail-disc library flow as the native app.

Gecko also requires user-provided system files for the appropriate paths (including GameCube IPL and DSP files), so nvd-emu must not bundle proprietary firmware. It is GPL-3.0; review the actual current license and source-distribution obligations before incorporating or redistributing any of it.

**Conclusion:** evaluate its current WASM crate, but test the exact browser build and retail-disc/Wii input path rather than inferring web feature parity from the native app.

## Integration milestones

1. **Build both browser candidates reproducibly in CI.** Pin source commits for `wasm-dolphin` and Gecko; record licenses, patch chains, asset sizes and browser requirements. Never publish an opaque prebuilt binary.
2. **Run a GameCube smoke test in a real browser.** Test homebrew first, then a user-supplied legally obtained disc image. Verify renderer, audio, pause, input and memory use.
3. **Test Wii separately.** Prove that the browser build can load a retail Wii ISO/RVZ and emulate the IOS/input paths required by actual games; native app support alone is not proof of web support.
4. **Benchmark on ordinary hardware.** Measure emulation speed, unique visual frames, audio gaps and input latency on both a Mac and a Windows PC. Reject any branch that only boots a demo or test pattern.
5. **Add nvd-emu launcher integration.** Game selection, progress/status, per-title settings, keyboard/controller remapping, save import/export, and clear compatibility labels.
6. **Implement persistent saves and state support only when exposed by the engine.** Use IndexedDB for appropriate saves, user-exportable files for backup, and explicit user controls to clear data.
7. **Run a compatibility suite.** Track boots/menu/in-game/playable separately, test Wii motion and pointer controls, and publish measured compatibility results rather than assumptions.

## Important limitations

- Performance is device- and game-dependent; JIT/recompiler availability, shared-memory requirements, browser security headers and GPU backend support can be limiting.
- Wii games often need motion controls; a keyboard-only mapping is not sufficient for full compatibility.
- Browser local storage can be cleared by the user or the browser, and some engines do not implement savestates for every system.
- Gecko is GPL-3.0. Before redistributing or linking its code/assets into a packaged release, choose a compatible nvd-emu license and meet all upstream notices/source obligations.
- Firmware, keys, IPL/DSP files and commercial games are not distributed by nvd-emu.

## Current status

**GameCube and Wii have experimental launch paths integrated.** NVD-EMU vendors the browser runtime from `wasm-dolphin` at pinned commit `7e38409ace3dda709c178312ff63fd92a3653cc7`; the Player and library route saved GameCube and Wii disc images into this isolated WebAssembly frontend. Upstream documents Wii-disc boot/run on the software path, but explicitly states that Wii Remote input is not implemented. Keyboard and gamepad mappings currently drive the existing GameCube-style control surface; Wii titles requiring pointer or motion controls may not be playable. This remains a research prototype, not a promise of broad compatibility. It needs desktop Chromium with WebGPU and SharedArrayBuffer; rendering, speed, audio, real Wii controls and saves still require real-device validation. GPL notices and a pinned upstream-source link are shipped alongside the runtime.
