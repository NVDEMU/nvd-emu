# GameCube and Wii in nvd-emu Web: feasibility plan

## Is browser emulation possible?

Yes. WebAssembly (WASM), WebGPU/WebGL, browser audio, the Gamepad API, and local file APIs make it technically possible to build a GameCube/Wii player for modern desktop browsers. The hard part is not displaying a webpage: it is delivering an accurate, sufficiently fast CPU recompiler, GPU renderer, audio/DSP timing, input and (for Wii) motion/pointer behavior, plus persistent save data.

This repository's current web engine, EmulatorJS, is designed for much lighter retro systems. Its core guide lists its supported cores and marks Dolphin as unavailable; a GameCube/Wii core should not be implied by a selector entry alone.

## Candidates evaluated

### 1. Gecko's browser/WASM build

Repository: https://github.com/Torashi1069/emu.nintendo.wii.gecko

- Written in Rust; GPL-3.0.
- Its README documents a browser WebAssembly crate and the command `wasm-pack build crates/web --target web --out-dir pkg --release`.
- The upstream project reports that it is still in development, and that many games have varying visual glitches or are outright broken.
- The public web frontend currently exposes IPL/DOL and DSP IROM file inputs. That proves a browser-oriented build exists, but does not by itself prove a polished retail-disc launcher, full game library, reliable save states, or production compatibility.
- The upstream engine expects user-supplied system files for appropriate paths. nvd-emu must not bundle proprietary IPL/DSP/BIOS/system files.

This is the strongest concrete browser/WASM candidate to evaluate first, subject to an upstream build/test and license review. It is not integrated into nvd-emu yet.

### 2. Dolphin

Official repository: https://github.com/dolphin-emu/dolphin

Dolphin is a mature native GameCube/Wii emulator, but porting its full runtime to browser WASM is a substantial project. A repository named "Dolphin Web" exists, but its code history inspected in October 2026 did not demonstrate a maintained, ready-to-use production browser package; don't assume a fork name proves browser support.

## Integration milestones

1. **Build and inspect upstream Gecko's WASM target in CI.** Record the exact source commit, licensing, output artifacts and browser requirements. Do not publish an opaque prebuilt binary.
2. **Run a homebrew/DOL smoke test in browser.** Verify keyboard, gamepad, renderer, audio, pause and browser memory limits.
3. **Test GameCube media loading.** Establish whether the WASM frontend can load a legally obtained ISO/RVZ directly, rather than treating a DOL test as retail game support.
4. **Add nvd-emu launcher integration.** Game selection, progress/status, per-title settings, keyboard and controller remapping, save import/export, and clear compatibility labels.
5. **Add Wii features.** Wiimote pointer, motion/tilt, shake, Nunchuk/Classic Controller extension mappings and motion fallback controls.
6. **Implement persistent save and state support only when exposed by the core.** Use IndexedDB for appropriate saves, user-exportable files for backup, and explicit user controls to clear data.
7. **Run a compatibility suite.** Start with open homebrew and user-supplied legally obtained dumps; track boots/menu/in-game/playable separately. Do not publish performance or compatibility claims without measured results.

## Important limitations

- Performance is device- and game-dependent; JIT/recompiler availability, shared-memory requirements, browser security headers and GPU backend support can be limiting.
- Wii games often need motion controls; a keyboard-only mapping is not sufficient for full compatibility.
- Browser local storage can be cleared by the user or the browser, and some engines do not implement savestates for every system.
- Gecko is GPL-3.0. Before redistributing or linking its code/assets into a packaged release, choose a compatible nvd-emu license and meet all upstream notices/source obligations.
- Firmware, keys, IPL/DSP files and commercial games are not distributed by nvd-emu.

## Current status

**Research candidate identified; not playable inside nvd-emu Web yet.** The UI labels this honestly. The next technical task is building and running a reproducible Gecko WASM smoke test, then deciding whether it can support disc-based retail games and the required state/input features.
