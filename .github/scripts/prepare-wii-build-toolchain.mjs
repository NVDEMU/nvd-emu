import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.argv[2] || process.env.UPSTREAM_ROOT || ".");
const lockPath = resolve(root, "provenance/wasm-toolchain.lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const env = process.env;
function required(name) {
  const value = env[name];
  if (!value) throw new Error("Missing " + name + "; toolchain setup did not publish it.");
  return value;
}
function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
function run(path, args) {
  const isBatch = process.platform === "win32" && /\.(bat|cmd)$/i.test(path);
  const command = isBatch ? (process.env.ComSpec || "cmd.exe") : path;
  const commandArgs = isBatch ? ["/d", "/s", "/c", path, ...args] : args;
  const result = spawnSync(command, commandArgs, { encoding: "utf8", windowsHide: true });
  if (result.error || result.status !== 0) {
    throw new Error("Could not run " + path + " " + args.join(" ") + ": " +
      (result.stderr || result.error || result.status));
  }
  return ((result.stdout || "") + "\n" + (result.stderr || "")).trim();
}
function firstVersion(output, label) {
  const match = output.match(/(?:^|\s)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?:\s|$)/m);
  if (!match) throw new Error("Cannot read " + label + " version from: " + output);
  return match[1];
}
function commitHash(output, label) {
  const match = output.match(/^commit-hash:\s*([0-9a-f]{40})\s*$/mi) ||
    output.match(/git hash:\s*([0-9a-f]{40})/i) ||
    output.match(/\(([0-9a-f]{40})\)/i);
  if (!match) throw new Error("Cannot read " + label + " commit hash from: " + output);
  return match[1];
}
const node = required("DOLPHIN_NODE");
const emcc = required("EMCC");
const emcmake = required("EMCMAKE");
const cmake = required("CMAKE");
const ninja = required("NINJA");
const rustc = required("RUSTC");
const cargo = required("CARGO");
const rustup = required("RUSTUP");
const emsdk = required("EMSDK");

lock.node.version = run(node, ["--version"]).replace(/^v/, "");
lock.node.sha256 = sha256(node);
lock.emscripten.emccSha256 = sha256(emcc);
lock.emscripten.emcmakeSha256 = sha256(emcmake);
const emccVersion = run(emcc, ["--version"]);
lock.emscripten.version = firstVersion(emccVersion, "Emscripten");
lock.emscripten.compilerCommit = commitHash(emccVersion, "Emscripten");
lock.emscripten.clangxxSha256 = sha256(resolve(dirname(emcc), "../bin/clang++.exe"));
lock.cmake.version = firstVersion(run(cmake, ["--version"]), "CMake");
lock.cmake.sha256 = sha256(cmake);
lock.ninja.version = run(ninja, ["--version"]).trim();
lock.ninja.sha256 = sha256(ninja);
const rustcVersion = run(rustc, ["--version", "--verbose"]);
lock.rust.rustcVersion = firstVersion(rustcVersion, "rustc");
lock.rust.rustcCommit = commitHash(rustcVersion, "rustc");
lock.rust.rustcSha256 = sha256(rustc);
const cargoVersion = run(cargo, ["--version", "--verbose"]);
lock.rust.cargoVersion = firstVersion(cargoVersion, "cargo");
lock.rust.cargoCommit = commitHash(cargoVersion, "cargo");
lock.rust.cargoSha256 = sha256(cargo);
lock.rust.rustupSha256 = sha256(rustup);
lock.rust.toolchain = required("DOLPHIN_RUST_TOOLCHAIN");
lock.platform = "win32-x64";
const emsdkCommit = run("git", ["-C", emsdk, "rev-parse", "HEAD"]);
if (emsdkCommit !== lock.emscripten.emsdkCommit) {
  throw new Error("emsdk commit mismatch: expected " + lock.emscripten.emsdkCommit + ", got " + emsdkCommit);
}
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
console.log("Prepared a temporary lock for the pinned WASM source and installed runner binaries.");
console.log(JSON.stringify({
  node: lock.node.version, emscripten: lock.emscripten.version,
  compilerCommit: lock.emscripten.compilerCommit, cmake: lock.cmake.version,
  ninja: lock.ninja.version, rustc: lock.rust.rustcVersion + " (" + lock.rust.rustcCommit + ")",
  cargo: lock.rust.cargoVersion + " (" + lock.rust.cargoCommit + ")", emsdkCommit
}, null, 2));
