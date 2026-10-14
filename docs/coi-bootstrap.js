/* Enables cross-origin isolation on static hosts such as GitHub Pages.
 * SharedArrayBuffer is required by the threaded EmulatorJS 3DS/Azahar core.
 * The matching response-header shim lives in sw.js so offline caching still works.
 */
(() => {
  "use strict";
  if (window.crossOriginIsolated === true) {
    try { sessionStorage.removeItem("nvd-emu-coi-reload"); } catch (_) {}
    return;
  }
  if (!window.isSecureContext || !("serviceWorker" in navigator)) return;

  let attempted = false;
  try { attempted = sessionStorage.getItem("nvd-emu-coi-reload") === "1"; } catch (_) {}
  if (attempted) return;

  let reloadScheduled = false;
  const reloadForIsolation = () => {
    if (reloadScheduled || window.crossOriginIsolated === true) return;
    reloadScheduled = true;
    try { sessionStorage.setItem("nvd-emu-coi-reload", "1"); } catch (_) {}
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener("controllerchange", reloadForIsolation, { once: true });
  navigator.serviceWorker.register("./sw.js").then(registration => {
    // A new worker calls clients.claim() during activation. Wait for controllerchange
    // before reloading so the next navigation receives COOP/COEP headers.
    if (!navigator.serviceWorker.controller && registration.active) reloadForIsolation();
  }).catch(error => {
    console.warn("NVD-EMU: cross-origin isolation could not be enabled.", error);
  });
})();