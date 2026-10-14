const CACHE_NAME = "nvd-emu-web-shell-v6";
const APP_FILES = [
  "./", "./index.html", "./library.html", "./systems.html", "./player.html",
  "./settings.html", "./site.css", "./systems-data.js", "./artwork.js",
  "./storage.js", "./coi-bootstrap.js", "./manifest.webmanifest",
  "./nvd-emu-logo.svg", "./assets/logos/arcade.svg"
];

// credentialless allows external images and scripts that don't provide CORP
// headers to load without sending cross-origin credentials.
let coepCredentialless = true;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES.map(path => new URL(path, self.registration.scope).toString())))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "coepCredentialless") {
    coepCredentialless = Boolean(event.data.value);
  }
});

function addIsolationHeaders(response) {
  if (!response || response.status === 0) return response;
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
  if (!coepCredentialless) headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function offlineResponse(request) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.origin === self.location.origin) {
    const cached = await caches.match(request);
    if (cached) return addIsolationHeaders(cached);
  }
  if (request.mode === "navigate") {
    const appIndex = new URL("./index.html", self.registration.scope).toString();
    const cachedIndex = await caches.match(appIndex);
    if (cachedIndex) return addIsolationHeaders(cachedIndex);
  }
  return Response.error();
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

  const requestForNetwork = coepCredentialless && request.mode === "no-cors"
    ? new Request(request, { credentials: "omit" })
    : request;

  event.respondWith(
    fetch(requestForNetwork).then(async response => {
      if (response.status === 0) return response;

      const url = new URL(request.url);
      if (request.method === "GET" && url.origin === self.location.origin && response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch (_) {}
      }
      return addIsolationHeaders(response);
    }).catch(() => offlineResponse(request))
  );
});