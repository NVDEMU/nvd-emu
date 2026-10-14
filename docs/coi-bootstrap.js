/* Cross-origin-isolation bootstrap for static hosting.
 * The 3DS/Azahar WebAssembly core requires SharedArrayBuffer.
 * GitHub Pages cannot set COOP/COEP response headers, so sw.js adds them.
 */
(() => {
  "use strict";
  const MODE_KEY = "nvd-emu-coi-mode";
  const userAgent = navigator.userAgent || "";
  // Orion and Safari use WebKit and need the broadly supported require-corp policy.
  const webKitBrowser = /AppleWebKit/i.test(userAgent) && !/(Chrome|Chromium|CriOS|Edg|OPR)/i.test(userAgent);
  const preferredMode = webKitBrowser ? "require-corp" : "credentialless";
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

  const storedMode = getMode();
  const currentMode = webKitBrowser ? "require-corp" : storedMode;
  const startupMode = currentMode || preferredMode;
  window.NVD_COI_MODE = startupMode;
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
    if (!storedMode || storedMode !== startupMode) {
      applyWorkerMode(startupMode, startupMode === "credentialless");
    } else if (storedMode === "credentialless" && !webKitBrowser) {
      // Try the more widely supported require-corp policy if credentialless failed.
      applyWorkerMode("require-corp", false);
    }
    // Stop retrying after one require-corp attempt; Settings exposes the diagnostic state.
    return;
  }

  sw.addEventListener("controllerchange", () => {
    if (window.crossOriginIsolated === true) return;
    applyWorkerMode(startupMode, startupMode === "credentialless");
  }, { once: true });
  sw.register("./sw.js").catch(error => {
    window.NVD_COI_MODE = "unavailable";
    console.warn("NVD-EMU: could not register the isolation service worker.", error);
  });
})();