/* Cross-origin-isolation bootstrap for static hosting.
 * The 3DS/Azahar WebAssembly core requires SharedArrayBuffer.
 * GitHub Pages cannot set COOP/COEP response headers, so sw.js adds them.
 */
(() => {
  "use strict";
  const MODE_KEY = "nvd-emu-coi-mode";
  const getMode = () => {
    try { return sessionStorage.getItem(MODE_KEY) || ""; } catch (_) { return ""; }
  };
  const setMode = mode => {
    try { sessionStorage.setItem(MODE_KEY, mode); } catch (_) {}
    window.NVD_COI_MODE = mode;
  };

  if (window.crossOriginIsolated === true && typeof SharedArrayBuffer === "function") {
    try { sessionStorage.removeItem(MODE_KEY); } catch (_) {}
    window.NVD_COI_MODE = "isolated";
    return;
  }

  const sw = navigator.serviceWorker;
  if (!window.isSecureContext || !sw) {
    window.NVD_COI_MODE = "unavailable";
    return;
  }

  const currentMode = getMode();
  window.NVD_COI_MODE = currentMode || "credentialless";
  let restarting = false;

  function applyWorkerMode(mode, credentialless) {
    if (restarting) return;
    restarting = true;
    setMode(mode);
    const controller = sw.controller;
    if (!controller) {
      restarting = false;
      return;
    }

    // Acknowledge the policy change before navigating so the next document
    // definitely receives the selected COEP mode.
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.location.reload();
    };
    try {
      const channel = new MessageChannel();
      channel.port1.onmessage = finish;
      controller.postMessage({ type: "coepCredentialless", value: credentialless }, [channel.port2]);
      window.setTimeout(finish, 700);
    } catch (_) {
      finish();
    }
  }

  if (sw.controller) {
    if (!currentMode) {
      applyWorkerMode("credentialless", true);
    } else if (currentMode === "credentialless") {
      // Safari does not currently implement COEP: credentialless. Try require-corp once.
      applyWorkerMode("require-corp", false);
    }
    // If the require-corp retry also fails, leave the page usable and expose
    // the failure in Settings instead of causing a reload loop.
    return;
  }

  sw.addEventListener("controllerchange", () => {
    if (window.crossOriginIsolated === true) return;
    applyWorkerMode("credentialless", true);
  }, { once: true });
  sw.register("./sw.js").catch(error => {
    window.NVD_COI_MODE = "unavailable";
    console.warn("NVD-EMU: could not register the isolation service worker.", error);
  });
})();