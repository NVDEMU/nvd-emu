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
  <p class="keyboard-dialog-note">Keyboard input is enabled by default. Select an action, then press the key you want to bind. Remappings are saved in this browser. Gamepads remain supported. Wii Remote motion and pointer input are not implemented in this browser build, so many Wii games will not be fully playable yet.</p>
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
app = replace_once(app, 'const OSD_PREF_KEY = "wasm-dolphin.osd-visible";', 'const OSD_PREF_KEY = "wasm-dolphin.osd-visible-v2";\nconst KEY_BINDINGS_PREF_KEY = "nvd-emu-keyboard-bindings-v1";', "app preferences")
app = replace_once(app, 'const keyboardPressed = new Set();', 'const keyboardPressed = new Set();\nlet keyboardBindings = readKeyboardBindings();\nlet keyCaptureControl = null;', "app keyboard state")
app = replace_once(app, 'wireDiagnostics();\nwirePanelToggle();', 'wireDiagnostics();\nwireKeyboardRemapping();\nwirePanelToggle();', "app remapping init")
app = replace_once(app, '  const osdVisible = localStorage.getItem(OSD_PREF_KEY) !== "0";', '  const osdVisible = localStorage.getItem(OSD_PREF_KEY) === "1";', "app OSD default")
app = replace_once(app, '  let open = true;\n  try { open = localStorage.getItem("wasmDolphinPanelOpen") !== "0"; } catch {}', '  let open = false;\n  try { open = localStorage.getItem("wasmDolphinPanelOpen-v2") === "1"; } catch {}', "app panel default")
app = replace_once(app, 'try { localStorage.setItem("wasmDolphinPanelOpen", open ? "1" : "0"); } catch {}', 'try { localStorage.setItem("wasmDolphinPanelOpen-v2", open ? "1" : "0"); } catch {}', "app panel storage")

helpers = r"""
function readKeyboardBindings() {
  try {
    const raw = localStorage.getItem(KEY_BINDINGS_PREF_KEY);
    if (!raw) return { ...DEFAULT_KEY_BINDINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...DEFAULT_KEY_BINDINGS };
    const valid = new Set(CONTROL_LABELS);
    return Object.fromEntries(Object.entries(parsed).filter(([code, control]) =>
      typeof code === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(code) && valid.has(control)));
  } catch (_) { return { ...DEFAULT_KEY_BINDINGS }; }
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
  try { localStorage.setItem(KEY_BINDINGS_PREF_KEY, JSON.stringify(keyboardBindings)); return true; }
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
  for (const control of CONTROL_LABELS) {
    const row = document.createElement("div");
    row.className = "keyboard-binding-row";
    const name = document.createElement("span");
    name.className = "keyboard-binding-name";
    name.textContent = formatControlLabel(control);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "keyboard-binding-key";
    const code = Object.keys(keyboardBindings).find((key) => keyboardBindings[key] === control);
    button.textContent = keyCaptureControl === control ? "Press a key…" : keyboardCodeLabel(code);
    button.classList.toggle("capturing", keyCaptureControl === control);
    button.setAttribute("aria-label", "Remap " + formatControlLabel(control));
    button.addEventListener("click", () => {
      keyCaptureControl = control;
      renderKeyboardBindings();
      setKeyboardCaptureStatus("Press a key for " + formatControlLabel(control) + ". Press Esc to cancel.");
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
  open.addEventListener("click", () => { renderKeyboardBindings(); if (!dialog.open) dialog.showModal(); });
  close.addEventListener("click", () => { keyCaptureControl = null; dialog.close(); });
  reset.addEventListener("click", () => {
    keyboardBindings = { ...DEFAULT_KEY_BINDINGS };
    try { localStorage.removeItem(KEY_BINDINGS_PREF_KEY); } catch (_) {}
    keyCaptureControl = null;
    renderKeyboardBindings();
    setKeyboardCaptureStatus("Default keyboard controls restored.");
  });
  dialog.addEventListener("cancel", () => { keyCaptureControl = null; });
  dialog.addEventListener("close", () => { keyCaptureControl = null; renderKeyboardBindings(); });
  renderKeyboardBindings();
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
app_path.write_text(app, encoding="utf-8")

if 'id="keyboardControlsDialog"' not in index_path.read_text(encoding="utf-8"):
    raise SystemExit("Keyboard controls dialog validation failed")
if "function wireKeyboardRemapping()" not in app_path.read_text(encoding="utf-8"):
    raise SystemExit("Keyboard remapping function validation failed")
print("Patched GameCube/Wii player UI, input remapping, hidden-by-default stats, and fullscreen.")
