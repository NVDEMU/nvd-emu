#!/usr/bin/env python3
"""Patch the pinned wasm-dolphin/Dolphin source with a browser Wii Remote input bridge.

Run after npm run fetch:dolphin + npm run patch:upstream:
    python .github/scripts/patch-wii-input-core.py <wasm-dolphin-root>
"""
from pathlib import Path
import re
import sys

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
CORE_CPP = ROOT / "core" / "upstream" / "dolphin_web_core.cpp"
WIIMOTE_CPP = ROOT / "vendor" / "dolphin" / "Source" / "Core" / "Core" / "HW" / "Wiimote.cpp"

def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one source anchor, got {count}")
    return source.replace(old, new, 1)

if not CORE_CPP.is_file():
    raise SystemExit(f"Missing browser bridge source: {CORE_CPP}")
if not WIIMOTE_CPP.is_file():
    raise SystemExit(f"Missing pinned Dolphin Wiimote source: {WIIMOTE_CPP}")

core = CORE_CPP.read_text(encoding="utf-8")
for include in (
    '#include "Core/HW/Wiimote.h"',
    '#include "Core/HW/WiimoteEmu/WiimoteEmu.h"',
    '#include "InputCommon/ControllerEmu/ControllerEmu.h"',
    '#include "InputCommon/ControllerEmu/ControlGroup/ControlGroup.h"',
    '#include "InputCommon/ControllerEmu/StickGate.h"',
    '#include "InputCommon/InputConfig.h"',
):
    if include not in core:
        core = replace_once(core, '#include "Core/HW/GCPad.h"', '#include "Core/HW/GCPad.h"\n' + include,
                            "include Wii Remote input headers")
for include in ("#include <optional>", "#include <string_view>", "#include <cmath>"):
    if include not in core:
        core = replace_once(core, "#include <memory>", "#include <memory>\n" + include,
                            "include standard-library types")

bridge = r'''
// NVD-EMU browser Wii Remote bridge. The existing SetInputState API only feeds
// GameCube PadStatus. This callback uses Dolphin's supported EmulatedController
// input-override hook, so buttons, acceleration, gyro and the IR cursor enter
// the regular Wii Remote emulation/report pipeline instead of being a UI-only map.
namespace NVDWiiInput
{
static std::atomic<std::uint32_t> s_buttons{0};
static std::atomic<std::uint32_t> s_dpad{0};
static std::atomic<std::int32_t> s_accel_x_milli{0};
static std::atomic<std::int32_t> s_accel_y_milli{0};
static std::atomic<std::int32_t> s_accel_z_milli{9807};
static std::atomic<std::int32_t> s_gyro_x_milli{0};
static std::atomic<std::int32_t> s_gyro_y_milli{0};
static std::atomic<std::int32_t> s_gyro_z_milli{0};
static std::atomic<std::int32_t> s_pointer_x_milli{0};
static std::atomic<std::int32_t> s_pointer_y_milli{0};
static std::atomic<int> s_pointer_enabled{0};

float ReadMilli(const std::atomic<std::int32_t>& value)
{
  return static_cast<float>(value.load(std::memory_order_relaxed)) / 1000.0f;
}

std::optional<ControlState> Override(
    const std::string_view group, const std::string_view control,
    const ControlState)
{
  const std::uint32_t buttons = s_buttons.load(std::memory_order_relaxed);
  if (group == "Buttons")
  {
    if (control == "A") return (buttons & (1u << 0)) ? 1.0 : 0.0;
    if (control == "B") return (buttons & (1u << 1)) ? 1.0 : 0.0;
    if (control == "1") return (buttons & (1u << 2)) ? 1.0 : 0.0;
    if (control == "2") return (buttons & (1u << 3)) ? 1.0 : 0.0;
    if (control == "-") return (buttons & (1u << 4)) ? 1.0 : 0.0;
    if (control == "+") return (buttons & (1u << 5)) ? 1.0 : 0.0;
    if (control == "Home") return (buttons & (1u << 6)) ? 1.0 : 0.0;
  }

  const std::uint32_t dpad = s_dpad.load(std::memory_order_relaxed);
  if (group == "D-Pad")
  {
    if (control == "Up") return (dpad & (1u << 0)) ? 1.0 : 0.0;
    if (control == "Down") return (dpad & (1u << 1)) ? 1.0 : 0.0;
    if (control == "Left") return (dpad & (1u << 2)) ? 1.0 : 0.0;
    if (control == "Right") return (dpad & (1u << 3)) ? 1.0 : 0.0;
  }

  if (group == "IMUAccelerometer")
  {
    if (control == ControllerEmu::ReshapableInput::X_INPUT_OVERRIDE)
      return ReadMilli(s_accel_x_milli);
    if (control == ControllerEmu::ReshapableInput::Y_INPUT_OVERRIDE)
      return ReadMilli(s_accel_y_milli);
    if (control == ControllerEmu::ReshapableInput::Z_INPUT_OVERRIDE)
      return ReadMilli(s_accel_z_milli);
  }
  if (group == "IMUGyroscope")
  {
    if (control == ControllerEmu::ReshapableInput::X_INPUT_OVERRIDE)
      return ReadMilli(s_gyro_x_milli);
    if (control == ControllerEmu::ReshapableInput::Y_INPUT_OVERRIDE)
      return ReadMilli(s_gyro_y_milli);
    if (control == ControllerEmu::ReshapableInput::Z_INPUT_OVERRIDE)
      return ReadMilli(s_gyro_z_milli);
  }
  if (group == "IR" && s_pointer_enabled.load(std::memory_order_relaxed))
  {
    if (control == ControllerEmu::ReshapableInput::X_INPUT_OVERRIDE)
      return ReadMilli(s_pointer_x_milli);
    if (control == ControllerEmu::ReshapableInput::Y_INPUT_OVERRIDE)
      return ReadMilli(s_pointer_y_milli);
  }
  return std::nullopt;
}

void Install()
{
  InputConfig* config = Wiimote::GetConfig();
  if (!config)
    return;
  // Four normal Wii Remote channels; the balance board is not a remote.
  for (unsigned int index = 0; index < 4; ++index)
  {
    if (ControllerEmu::EmulatedController* controller = config->GetController(index))
      controller->SetInputOverrideFunction(Override);
  }
}
}  // namespace NVDWiiInput

extern "C" void DolphinWeb_InstallWiiRemoteInputOverrides()
{
  NVDWiiInput::Install();
}

extern "C"
{
EMSCRIPTEN_KEEPALIVE
void SetWiiRemoteState(unsigned int buttons, unsigned int dpad,
                       float accel_x, float accel_y, float accel_z,
                       float gyro_x, float gyro_y, float gyro_z,
                       float pointer_x, float pointer_y, int pointer_enabled)
{
  auto store_milli = [](std::atomic<std::int32_t>& target, float value) {
    if (!std::isfinite(value))
      value = 0.0f;
    value = std::max(-32767.0f, std::min(32767.0f, value));
    target.store(static_cast<std::int32_t>(std::lround(value * 1000.0f)),
                 std::memory_order_relaxed);
  };
  NVDWiiInput::s_buttons.store(buttons & 0x7fu, std::memory_order_relaxed);
  NVDWiiInput::s_dpad.store(dpad & 0x0fu, std::memory_order_relaxed);
  store_milli(NVDWiiInput::s_accel_x_milli, accel_x);
  store_milli(NVDWiiInput::s_accel_y_milli, accel_y);
  store_milli(NVDWiiInput::s_accel_z_milli, accel_z);
  store_milli(NVDWiiInput::s_gyro_x_milli, gyro_x);
  store_milli(NVDWiiInput::s_gyro_y_milli, gyro_y);
  store_milli(NVDWiiInput::s_gyro_z_milli, gyro_z);
  store_milli(NVDWiiInput::s_pointer_x_milli, pointer_x);
  store_milli(NVDWiiInput::s_pointer_y_milli, pointer_y);
  NVDWiiInput::s_pointer_enabled.store(pointer_enabled ? 1 : 0, std::memory_order_relaxed);
}
}
'''

if "NVDWiiInput::Install()" not in core:
    core = replace_once(core, '#include <pthread.h>\n',
                        '#include <pthread.h>\n' + bridge + '\n',
                        "insert Wii Remote core bridge")
elif "SetWiiRemoteState" not in core:
    raise SystemExit("Wii Remote bridge namespace exists but exported input setter is missing")

WIIMOTE_DECL = '#include "InputCommon/InputConfig.h"\n'
wiimote = WIIMOTE_CPP.read_text(encoding="utf-8")
if "DolphinWeb_InstallWiiRemoteInputOverrides" not in wiimote:
    wiimote = replace_once(wiimote, WIIMOTE_DECL,
                            WIIMOTE_DECL + '\n#ifdef __EMSCRIPTEN__\nextern "C" void DolphinWeb_InstallWiiRemoteInputOverrides();\n#endif\n',
                            "declare Wii Remote bridge installer")
if "DolphinWeb_InstallWiiRemoteInputOverrides();" not in wiimote[wiimote.find("void Initialize(InitializeMode init_mode)") :]:
    wiimote = replace_once(wiimote,
        '  RefreshConfig();\n\n  WiimoteReal::Initialize(init_mode);',
        '  RefreshConfig();\n#ifdef __EMSCRIPTEN__\n  DolphinWeb_InstallWiiRemoteInputOverrides();\n#endif\n\n  WiimoteReal::Initialize(init_mode);',
        "install Wii Remote input overrides after Wiimote controllers are created")

# The runtime calls Module._SetWiiRemoteState directly, so explicitly add it to
# every Emscripten API export list that already exports SetInputState.
changed_exports = 0
for cmake_path in (ROOT / "vendor" / "dolphin").rglob("CMakeLists.txt"):
    text = cmake_path.read_text(encoding="utf-8", errors="ignore")
    if "_SetInputState" not in text or "_SetWiiRemoteState" in text:
        continue
    updated = re.sub(r"(['\"])_SetInputState\1", lambda m: m.group(0) + "," + m.group(1) + "_SetWiiRemoteState" + m.group(1), text)
    if updated != text:
        cmake_path.write_text(updated, encoding="utf-8", newline="")
        changed_exports += 1
if changed_exports < 1:
    raise SystemExit("Did not find an Emscripten export list containing _SetInputState")

CORE_CPP.write_text(core, encoding="utf-8", newline="")
WIIMOTE_CPP.write_text(wiimote, encoding="utf-8", newline="")

# Fast source assertions catch mismatched patches before invoking the expensive build.
assert "EMSCRIPTEN_KEEPALIVE\nvoid SetWiiRemoteState" in CORE_CPP.read_text(encoding="utf-8")
assert "DolphinWeb_InstallWiiRemoteInputOverrides();" in WIIMOTE_CPP.read_text(encoding="utf-8")
print(f"Patched Wii Remote buttons, D-pad, motion, mouse pointer, and {changed_exports} Emscripten export list(s).")
