/* Enable SharedArrayBuffer only on the dedicated 3DS player route.
 * Keeping the rest of the UI non-isolated lets public cover-art hosts load normally.
 * GitHub Pages cannot set COOP/COEP headers, so the service worker adds them to
 * the player.html?system=3ds navigation response.
 */
(() => {
  "use strict";
  const wants3dsIsolation = window.location.pathname.endsWith("/player.html")
    && new URLSearchParams(window.location.search).get("system") === "3ds";
  const MODE_KEY = "nvd-emu-coi-3ds-reload-v12";
  const sw = navigator.serviceWorker;

  if (!wants3dsIsolation) {
    window.NVD_COI_MODE = "inactive";
    if (window.isSecureContext && sw) {
      sw.register("./sw.js").catch(error => {
        console.warn("NVD-EMU: could not register the service worker.", error);
      });
    }
    return;
  }

  const setUnavailable = () => {
    window.NVD_COI_MODE = "unavailable";
    console.warn("NVD-EMU: 3DS isolation could not be enabled in this browser context.");
  };
  const isolated = () => window.crossOriginIsolated === true
    && typeof SharedArrayBuffer === "function";

  if (isolated()) {
    try { sessionStorage.removeItem(MODE_KEY); } catch (_) {}
    window.NVD_COI_MODE = "isolated";
    return;
  }
  if (!window.isSecureContext || !sw) {
    setUnavailable();
    return;
  }

  let reloadQueued = false;
  const attemptReload = () => {
    if (isolated()) {
      try { sessionStorage.removeItem(MODE_KEY); } catch (_) {}
      window.NVD_COI_MODE = "isolated";
      return;
    }
    if (reloadQueued) return;
    reloadQueued = true;
    let alreadyTried = false;
    try { alreadyTried = sessionStorage.getItem(MODE_KEY) === "1"; } catch (_) {}
    if (alreadyTried) {
      setUnavailable();
      return;
    }
    try { sessionStorage.setItem(MODE_KEY, "1"); } catch (_) {}
    window.location.reload();
  };

  if (sw.controller) {
    attemptReload();
    return;
  }

  sw.addEventListener("controllerchange", attemptReload, { once: true });
  sw.register("./sw.js").catch(error => {
    setUnavailable();
    console.warn("NVD-EMU: could not register the isolation service worker.", error);
  });
})();
