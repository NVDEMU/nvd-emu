from pathlib import Path

def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one patch anchor, found {count}")
    return source.replace(old, new, 1)

root = Path("docs/gamecube-engine")
index_path = root / "index.html"
html = index_path.read_text(encoding="utf-8")

style = """<style>
.keyboard-controls-dialog{width:min(760px,calc(100vw - 24px));max-height:min(86vh,850px);padding:18px;border:1px solid #454854;border-radius:16px;background:#15171d;color:#f5f5f7;box-shadow:0 25px 90px #000b}
.keyboard-controls-dialog::backdrop{background:#000b;backdrop-filter:blur(4px)}
.keyboard-dialog-heading,.keyboard-dialog-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.keyboard-dialog-heading h2{margin:0;font-size:19px}
.keyboard-dialog-note{color:#b6bac5;font-size:13px;line-height:1.5;margin:12px 0}
.keyboard-bindings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:52vh;overflow:auto;margin:14px 0;padding:1px}
.keyboard-binding-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid #343744;border-radius:9px;background:#1c1f27;min-width:0}
.keyboard-binding-name{text-transform:capitalize;font-size:12px;color:#d7d9e0}
.keyboard-binding-key{min-width:105px;max-width:48%;padding:8px 10px;border:1px solid #515568;border-radius:7px;background:#282c37;color:#fff;font-weight:750}
.keyboard-binding-key.capturing{background:#55383d;border-color:#ff9296;color:#fff}
#keyboardCaptureStatus{margin:0 0 12px;color:#aeb4c3;font-size:12px;line-height:1.5}
#screenHud[hidden]{display:none!important}
#fullscreenButton{min-width:118px}
@media(max-width:600px){.keyboard-bindings-grid{grid-template-columns:1fr}.keyboard-controls-dialog{padding:12px}#fullscreenButton{min-width:0}.topbar-actions{gap:5px}}
</style>"""

if "keyboard-controls-dialog" not in html:
    html = replace_once(html, "</head>", style + "\n</head>", "engine keyboard styles")
html = replace_once(
    html,
    '<button class="icon-button" id="overlayToggle" type="button" title="Toggle FPS overlay" aria-pressed="true">FPS</button>',
    '<button class="icon-button" id="overlayToggle" type="button" title="Toggle performance overlay" aria-pressed="false">FPS</button>\n          <button class="icon-button" id="keyboardControlsButton" type="button" title="Remap keyboard controls" aria-haspopup="dialog">KEYS</button>',
    "engine keyboard button")
html = replace_once(
    html,
    '<button class="icon-button" id="fullscreenButton" type="button" title="Fullscreen" aria-label="Fullscreen">[]</button>',
    '<button class="icon-button" id="fullscreenButton" type="button" title="Show the game fullscreen" aria-label="Enter fullscreen">Fullscreen</button>',
    "engine fullscreen button")
html = html.replace(
    'accept=".iso,.nkit.iso,.gcm,.rvz,.wbfs,.ciso,.dol,.elf"',
    'accept=".iso,.nkit.iso,.gcm,.rvz,.wbfs,.ciso,.wia,.gcz,.dol,.elf"', 1)
dialog = """<dialog id="keyboardControlsDialog" class="keyboard-controls-dialog" aria-labelledby="keyboardControlsHeading">
  <div class="keyboard-dialog-heading"><h2 id="keyboardControlsHeading">Keyboard controls</h2><button id="closeKeyboardControls" type="button" class="icon-button" aria-label="Close keyboard controls">Done</button></div>
  <p class="keyboard-dialog-note" id="keyboardControlsNote">Keyboard input is enabled by default. Select an action, then press the key you want to bind. Remappings are saved in this browser. Gamepads remain supported.</p>
  <div id="keyboardBindingsGrid" class="keyboard-bindings-grid"></div>
  <div class="keyboard-dialog-actions"><button id="resetKeyboardBindings" type="button" class="icon-button">Reset default keys</button></div>
  <p id="keyboardCaptureStatus" role="status" aria-live="polite">Select an action to change its key.</p>
</dialog>"""
if 'id="keyboardControlsDialog"' not in html:
    marker = '<script type="module" src="./src/bootstrap.js"></script>'
    html = replace_once(html, marker, dialog + "\n" + marker, "engine keyboard dialog")
index_path.write_text(html, encoding="utf-8")

app_path = root / "src" / "app.js"
app = app_path.read_text(encoding="utf-8")
app = replace_once(app, '  CONTROL_LABELS,\n  formatControlLabel,', '  CONTROL_LABELS,\n  DEFAULT_KEY_BINDINGS,\n  formatControlLabel,', "app keyboard import")
app = replace_once(app, 'const OSD_PREF_KEY = "wasm-dolphin.osd-visible";', 'const OSD_PREF_KEY = "wasm-dolphin.osd-visible-v2";\nconst KEY_BINDINGS_PREF_KEY = "nvd-emu-keyboard-bindings-v1";\nconst WII_KEY_BINDINGS_PREF_KEY = "nvd-emu-wii-keyboard-bindings-v1";\nconst isWiiMode = new URLSearchParams(window.location.search).get("system") === "wii";\nconst WII_CONTROL_LABELS = Object.freeze(["WII_A","WII_B","WII_ONE","WII_TWO","WII_PLUS","WII_MINUS","WII_HOME","WII_DPAD_UP","WII_DPAD_DOWN","WII_DPAD_LEFT","WII_DPAD_RIGHT","WII_MOTION_UP","WII_MOTION_DOWN","WII_MOTION_LEFT","WII_MOTION_RIGHT"]);\nconst DEFAULT_WII_KEY_BINDINGS = Object.freeze({KeyX:"WII_A",KeyZ:"WII_B",Digit1:"WII_ONE",Digit2:"WII_TWO",Enter:"WII_PLUS",Backspace:"WII_MINUS",KeyH:"WII_HOME",KeyI:"WII_DPAD_UP",KeyK:"WII_DPAD_DOWN",KeyJ:"WII_DPAD_LEFT",KeyL:"WII_DPAD_RIGHT",ArrowUp:"WII_MOTION_UP",ArrowDown:"WII_MOTION_DOWN",ArrowLeft:"WII_MOTION_LEFT",ArrowRight:"WII_MOTION_RIGHT"});', "app preferences")
app = replace_once(app, 'const keyboardPressed = new Set();', 'const keyboardPressed = new Set();\nlet keyboardBindings = readKeyboardBindings();\nlet keyCaptureControl = null;\nlet wiiPressed = new Set();\nlet wiiPointer = { x: 0, y: 0, enabled: false };', "app keyboard state")
app = replace_once(app, 'wireDiagnostics();\nwirePanelToggle();', 'wireDiagnostics();\nwireKeyboardRemapping();\nwirePanelToggle();', "app remapping init")
app = replace_once(app, '  const osdVisible = localStorage.getItem(OSD_PREF_KEY) !== "0";', '  const osdVisible = localStorage.getItem(OSD_PREF_KEY) === "1";', "app OSD default")
app = replace_once(app, '  let open = true;\n  try { open = localStorage.getItem("wasmDolphinPanelOpen") !== "0"; } catch {}', '  let open = false;\n  try { open = localStorage.getItem("wasmDolphinPanelOpen-v2") === "1"; } catch {}', "app panel default")
app = replace_once(app, 'try { localStorage.setItem("wasmDolphinPanelOpen", open ? "1" : "0"); } catch {}', 'try { localStorage.setItem("wasmDolphinPanelOpen-v2", open ? "1" : "0"); } catch {}', "app panel storage")

helpers = r"""
function activeControlLabels() {
  return isWiiMode ? WII_CONTROL_LABELS : CONTROL_LABELS;
}
function defaultKeyboardBindings() {
  return { ...(isWiiMode ? DEFAULT_WII_KEY_BINDINGS : DEFAULT_KEY_BINDINGS) };
}
function activeBindingStorageKey() {
  return isWiiMode ? WII_KEY_BINDINGS_PREF_KEY : KEY_BINDINGS_PREF_KEY;
}
function displayKeyboardControl(control) {
  const labels = {
    WII_A:"Wii Remote A", WII_B:"Wii Remote B", WII_ONE:"Wii Remote 1",
    WII_TWO:"Wii Remote 2", WII_PLUS:"Wii Remote +", WII_MINUS:"Wii Remote −",
    WII_HOME:"Wii Remote HOME", WII_DPAD_UP:"Wii D-pad Up", WII_DPAD_DOWN:"Wii D-pad Down",
    WII_DPAD_LEFT:"Wii D-pad Left", WII_DPAD_RIGHT:"Wii D-pad Right",
    WII_MOTION_UP:"Motion Up", WII_MOTION_DOWN:"Motion Down",
    WII_MOTION_LEFT:"Motion Left", WII_MOTION_RIGHT:"Motion Right"
  };
  return labels[control] || formatControlLabel(control);
}
function readKeyboardBindings() {
  try {
    const raw = localStorage.getItem(activeBindingStorageKey());
    if (!raw) return defaultKeyboardBindings();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaultKeyboardBindings();
    const valid = new Set(activeControlLabels());
    return Object.fromEntries(Object.entries(parsed).filter(([code, control]) =>
      typeof code === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(code) && valid.has(control)));
  } catch (_) { return defaultKeyboardBindings(); }
}
function keyboardCodeLabel(code) {
  if (!code) return "Unassigned";
  if (code.startsWith("Key") && code.length === 4) return code.slice(3);
  if (code.startsWith("Digit") && code.length === 6) return code.slice(5);
  const labels = {ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→",Enter:"Enter",Space:"Space",Backspace:"Backspace",NumpadEnter:"Numpad Enter",Minus:"-",Equal:"=",BracketLeft:"[",BracketRight:"]",Backslash:"\\",Semicolon:";",Quote:"'",Comma:",",Period:".",Slash:"/",Escape:"Esc",PageUp:"Page Up",PageDown:"Page Down"};
  return labels[code] || code;
}
function setKeyboardCaptureStatus(message) {
  const status = document.getElementById("keyboardCaptureStatus");
  if (status) status.textContent = message;
}
function saveKeyboardBindings() {
  try { localStorage.setItem(activeBindingStorageKey(), JSON.stringify(keyboardBindings)); return true; }
  catch (_) { setKeyboardCaptureStatus("Remap works for this session, but browser storage blocked saving it."); return false; }
}
function assignKeyboardBinding(code, control) {
  const previousCode = Object.keys(keyboardBindings).find((key) => keyboardBindings[key] === control);
  const displacedControl = keyboardBindings[code];
  if (previousCode && previousCode !== code) {
    delete keyboardBindings[previousCode];
    if (displacedControl && displacedControl !== control) keyboardBindings[previousCode] = displacedControl;
  }
  keyboardBindings[code] = control;
  saveKeyboardBindings();
}
function renderKeyboardBindings() {
  const grid = document.getElementById("keyboardBindingsGrid");
  if (!grid) return;
  grid.replaceChildren();
  for (const control of activeControlLabels()) {
    const row = document.createElement("div");
    row.className = "keyboard-binding-row";
    const name = document.createElement("span");
    name.className = "keyboard-binding-name";
    name.textContent = displayKeyboardControl(control);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "keyboard-binding-key";
    const code = Object.keys(keyboardBindings).find((key) => keyboardBindings[key] === control);
    button.textContent = keyCaptureControl === control ? "Press a key…" : keyboardCodeLabel(code);
    button.classList.toggle("capturing", keyCaptureControl === control);
    button.setAttribute("aria-label", "Remap " + displayKeyboardControl(control));
    button.addEventListener("click", () => {
      keyCaptureControl = control;
      renderKeyboardBindings();
      setKeyboardCaptureStatus("Press a key for " + displayKeyboardControl(control) + ". Press Esc to cancel.");
    });
    row.append(name, button);
    grid.append(row);
  }
}
function wireKeyboardRemapping() {
  const dialog = document.getElementById("keyboardControlsDialog");
  const open = document.getElementById("keyboardControlsButton");
  const close = document.getElementById("closeKeyboardControls");
  const reset = document.getElementById("resetKeyboardBindings");
  if (!dialog || !open || !close || !reset) return;
  const note = document.getElementById("keyboardControlsNote");
  if (note) note.textContent = isWiiMode
    ? "Wii Remote buttons and motion directions are remappable. Arrow keys simulate motion by default. The mouse is the fixed pointer and cannot be remapped. Gamepad buttons also map to Wii Remote buttons."
    : "Keyboard input and gamepad controls are enabled by default. Select an action, then press its replacement key. Remappings are saved in this browser.";
  open.addEventListener("click", () => { renderKeyboardBindings(); if (!dialog.open) dialog.showModal(); });
  close.addEventListener("click", () => { keyCaptureControl = null; dialog.close(); });
  reset.addEventListener("click", () => {
    keyboardBindings = defaultKeyboardBindings();
    try { localStorage.removeItem(activeBindingStorageKey()); } catch (_) {}
    keyCaptureControl = null;
    renderKeyboardBindings();
    setKeyboardCaptureStatus("Default keyboard controls restored.");
  });
  dialog.addEventListener("cancel", () => { keyCaptureControl = null; });
  dialog.addEventListener("close", () => { keyCaptureControl = null; renderKeyboardBindings(); });
  renderKeyboardBindings();
}
function syncWiiInput(source = "Keyboard") {
  if (!isWiiMode) return;
  const held = (name) => wiiPressed.has(name);
  const buttonMask =
    (held("WII_A") ? 1 << 0 : 0) |
    (held("WII_B") ? 1 << 1 : 0) |
    (held("WII_ONE") ? 1 << 2 : 0) |
    (held("WII_TWO") ? 1 << 3 : 0) |
    (held("WII_MINUS") ? 1 << 4 : 0) |
    (held("WII_PLUS") ? 1 << 5 : 0) |
    (held("WII_HOME") ? 1 << 6 : 0);
  const dpadMask =
    (held("WII_DPAD_UP") ? 1 << 0 : 0) |
    (held("WII_DPAD_DOWN") ? 1 << 1 : 0) |
    (held("WII_DPAD_LEFT") ? 1 << 2 : 0) |
    (held("WII_DPAD_RIGHT") ? 1 << 3 : 0);
  const motionX = Number(held("WII_MOTION_RIGHT")) - Number(held("WII_MOTION_LEFT"));
  const motionY = Number(held("WII_MOTION_UP")) - Number(held("WII_MOTION_DOWN"));
  host.setWiiRemoteState({
    buttonMask, dpadMask,
    accelX: motionX * 9.80665, accelY: motionY * 9.80665, accelZ: 9.80665,
    gyroX: -motionY * 2.4, gyroY: -motionX * 2.4, gyroZ: 0,
    pointerX: wiiPointer.x, pointerY: wiiPointer.y, pointerEnabled: wiiPointer.enabled
  });
  if (elements.inputSource) elements.inputSource.textContent = source + " · Wii Remote";
  for (const chip of elements.controlGrid.children) chip.classList.toggle("active", wiiPressed.has(chip.dataset.control));
}
function wireWiiPointer() {
  if (!isWiiMode || !elements.screen) return;
  const update = (event) => {
    if (document.getElementById("keyboardControlsDialog")?.open) return;
    const rect = elements.screen.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    wiiPointer = {
      x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1)),
      y: Math.max(-1, Math.min(1, 1 - ((event.clientY - rect.top) / rect.height) * 2)),
      enabled: true
    };
    syncInput("Mouse pointer");
  };
  elements.screen.addEventListener("mousemove", update, { passive: true });
}

"""
app = replace_once(app, "function wireKeyboard() {", helpers + "function wireKeyboard() {", "app keyboard helpers")
old_down = '''function wireKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    const button = resolveKeyboardButton(event.code);'''
new_down = '''function wireKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (keyCaptureControl) {
      if (event.code === "Escape") {
        keyCaptureControl = null;
        event.preventDefault();
        event.stopImmediatePropagation();
        renderKeyboardBindings();
        setKeyboardCaptureStatus("Key capture cancelled. Click any action to remap it.");
        return;
      }
      if (["Tab","ShiftLeft","ShiftRight","ControlLeft","ControlRight","AltLeft","AltRight","MetaLeft","MetaRight"].includes(event.code)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const control = keyCaptureControl;
      assignKeyboardBinding(event.code, control);
      keyCaptureControl = null;
      renderKeyboardBindings();
      setKeyboardCaptureStatus(formatControlLabel(control) + " mapped to " + keyboardCodeLabel(event.code) + ".");
      return;
    }
    if (event.repeat) {
      return;
    }

    const button = resolveKeyboardButton(event.code, keyboardBindings);'''
app = replace_once(app, old_down, new_down, "app keyboard keydown")
app = replace_once(app, '  document.addEventListener("keyup", (event) => {\n    const button = resolveKeyboardButton(event.code);', '  document.addEventListener("keyup", (event) => {\n    if (keyCaptureControl) return;\n    const button = resolveKeyboardButton(event.code, keyboardBindings);', "app keyboard keyup")

old_fs = '''  elements.fullscreenButton.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await elements.dropZone.requestFullscreen();
    }
  });'''
new_fs = '''  const updateFullscreenLabel = () => {
    const active = Boolean(document.fullscreenElement);
    elements.fullscreenButton.textContent = active ? "Exit fullscreen" : "Fullscreen";
    elements.fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
    elements.fullscreenButton.title = active ? "Exit fullscreen (Esc)" : "Show the game fullscreen";
  };
  elements.fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (elements.dropZone.requestFullscreen) await elements.dropZone.requestFullscreen();
      else throw new Error("Fullscreen is not supported by this browser.");
      updateFullscreenLabel();
    } catch (error) {
      setStatus("Could not enter fullscreen. Allow fullscreen for this site and try again.", "error");
    }
  });
  document.addEventListener("fullscreenchange", updateFullscreenLabel);
  updateFullscreenLabel();'''
app = replace_once(app, old_fs, new_fs, "app fullscreen")
          app = replace_once(app, 'function syncInput(source) {\n  combinedPressed = mergePressedSets(keyboardPressed, touchPressed, gamepadPressed);\n  host.setInputState(inputStateFromPressed(combinedPressed, gamepadInputState));',
              'function syncInput(source) {\n  combinedPressed = mergePressedSets(keyboardPressed, touchPressed, gamepadPressed);\n  if (isWiiMode) {\n    const aliases = {A:"WII_A",B:"WII_B",X:"WII_ONE",Y:"WII_TWO",START:"WII_PLUS",L:"WII_MINUS",Z:"WII_HOME",D_UP:"WII_DPAD_UP",D_DOWN:"WII_DPAD_DOWN",D_LEFT:"WII_DPAD_LEFT",D_RIGHT:"WII_DPAD_RIGHT"};\n    wiiPressed = new Set([...combinedPressed].map((button) => aliases[button] || button).filter((button) => WII_CONTROL_LABELS.includes(button)));\n    syncWiiInput(source);\n    return;\n  }\n  host.setInputState(inputStateFromPressed(combinedPressed, gamepadInputState));',
              "sync input Wii route")
          app = replace_once(app, 'function renderControlGrid() {\n  const fragment = document.createDocumentFragment();\n\n  for (const label of CONTROL_LABELS) {',
              'function renderControlGrid() {\n  const fragment = document.createDocumentFragment();\n\n  for (const label of activeControlLabels()) {',
              "render active controls")
          app = replace_once(app, '      chip.textContent = formatControlLabel(label);',
              '      chip.textContent = displayKeyboardControl(label);',
              "control grid labels")
          app = replace_once(app, 'wireKeyboard();\nwireTouchControls();\nwireGamepadPolling();',
              'wireKeyboard();\nwireTouchControls();\nwireWiiPointer();\nwireGamepadPolling();',
              "wire Wii pointer")
          app = replace_once(app, '  .then(runSmokeScenario)\n  .catch((error) => {',
              '  .then(() => { if (isWiiMode) syncInput("Wii Remote ready"); return runSmokeScenario(); })\n  .catch((error) => {',
              "initial Wii state")
          app = replace_once(app, '    syncGameInfo(game);\n    host.start();',
              '    syncGameInfo(game);\n    host.start();\n    if (isWiiMode) syncInput("Wii Remote ready");',
              "Wii state after boot")
          app_path.write_text(app, encoding="utf-8")

          core_host_path = Path("docs/gamecube-engine/src/core-host.js")
          core_host = core_host_path.read_text(encoding="utf-8")
          core_host = replace_once(core_host,
              '  setInputState(inputState) {\n    this.buttonMask = inputState?.mask >>> 0;\n    this.adapter.setInputState?.(inputState);\n  }',
              '  setInputState(inputState) {\n    this.buttonMask = inputState?.mask >>> 0;\n    this.adapter.setInputState?.(inputState);\n  }\n\n  setWiiRemoteState(state) {\n    this.adapter.setWiiRemoteState?.(state);\n  }',
              "core host Wii input forwarding")
          core_host_path.write_text(core_host, encoding="utf-8")

          adapter_path = Path("docs/gamecube-engine/src/upstream-worker-adapter.js")
          adapter = adapter_path.read_text(encoding="utf-8")
          adapter = replace_once(adapter, '  setInputState(state) {',
              '  setWiiRemoteState(state) {\n    if (!this.loaded || !state) return;\n    const packed = {buttonMask:state.buttonMask >>> 0,dpadMask:state.dpadMask >>> 0,accelX:Number(state.accelX)||0,accelY:Number(state.accelY)||0,accelZ:Number(state.accelZ)||0,gyroX:Number(state.gyroX)||0,gyroY:Number(state.gyroY)||0,gyroZ:Number(state.gyroZ)||0,pointerX:Number(state.pointerX)||0,pointerY:Number(state.pointerY)||0,pointerEnabled:state.pointerEnabled?1:0};\n    const signature = Object.values(packed).join(":");\n    if (signature === this.lastWiiRemoteStateSignature) return;\n    this.lastWiiRemoteStateSignature = signature;\n    this.post("setWiiRemoteState", packed);\n  }\n\n  setInputState(state) {',
              "worker adapter Wii input")
          adapter_path.write_text(adapter, encoding="utf-8")

          worker_path = Path("docs/gamecube-engine/src/upstream-discio-worker.js")
          worker = worker_path.read_text(encoding="utf-8")
          worker = replace_once(worker,
              '    runFrame: cwrap("RunFrame", null, []),',
              '    setWiiRemoteState: optionalCwrap("SetWiiRemoteState", null, ["number","number","number","number","number","number","number","number","number","number","number"]),\n    runFrame: cwrap("RunFrame", null, []),',
              "worker Wii input API")
          worker = replace_once(worker,
              '    case "runFrame":',
              '    case "setWiiRemoteState":\n      api?.setWiiRemoteState?.(payload.buttonMask >>> 0,payload.dpadMask >>> 0,Number(payload.accelX)||0,Number(payload.accelY)||0,Number(payload.accelZ)||0,Number(payload.gyroX)||0,Number(payload.gyroY)||0,Number(payload.gyroZ)||0,Number(payload.pointerX)||0,Number(payload.pointerY)||0,payload.pointerEnabled?1:0);\n      return {};\n    case "runFrame":',
              "worker Wii input message")
          worker_path.write_text(worker, encoding="utf-8")
          app_path.write_text(app, encoding="utf-8")

if 'id="keyboardControlsDialog"' not in index_path.read_text(encoding="utf-8"):
    raise SystemExit("Keyboard controls dialog validation failed")
if "function wireKeyboardRemapping()" not in app_path.read_text(encoding="utf-8"):
    raise SystemExit("Keyboard remapping function validation failed")
print("Patched GameCube/Wii player UI, input remapping, hidden-by-default stats, and fullscreen.")
