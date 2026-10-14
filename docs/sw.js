const CACHE_NAME = "nvd-emu-web-shell-v12";
const APP_FILES = [
  "./", "./index.html", "./library.html", "./systems.html", "./player.html",
  "./settings.html", "./site.css", "./systems-data.js", "./artwork.js",
  "./storage.js", "./coi-bootstrap.js", "./manifest.webmanifest",
  "./nvd-emu-logo.svg", "./assets/logos/atari.svg", "./assets/logos/playstation.svg", "./assets/logos/sega.svg", "./assets/logos/nec.svg", "./assets/logos/commodore.svg"
];

// Apply cross-origin isolation only to the dedicated 3DS player page. Other pages
// can keep loading public game artwork from hosts that do not opt into CORS/CORP.
const userAgent = self.navigator && self.navigator.userAgent || "";
const webKitBrowser = /AppleWebKit/i.test(userAgent) && !/(Chrome|Chromium|CriOS|Edg|OPR)/i.test(userAgent);
const isolationPolicy = webKitBrowser ? "require-corp" : "credentialless";

function is3dsPlayerNavigation(request) {
  if (!request || request.mode !== "navigate") return false;
  const url = new URL(request.url);
  return url.pathname.endsWith("/player.html") && url.searchParams.get("system") === "3ds";
}

function addIsolationHeaders(response, request) {
  if (!response || response.status === 0 || !is3dsPlayerNavigation(request)) return response;
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", isolationPolicy);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

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

async function offlineResponse(request) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.origin === self.location.origin) {
    const cached = await caches.match(request);
    if (cached) return addIsolationHeaders(cached, request);
  }
  if (request.mode === "navigate") {
    const appIndex = new URL("./index.html", self.registration.scope).toString();
    const cachedIndex = await caches.match(appIndex);
    if (cachedIndex) return addIsolationHeaders(cachedIndex, request);
  }
  return Response.error();
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

  event.respondWith(
    fetch(request).then(async response => {
      if (response.status === 0) return response;

      const url = new URL(request.url);
      if (request.method === "GET" && url.origin === self.location.origin && response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch (_) {}
      }
      return addIsolationHeaders(response, request);
    }).catch(() => offlineResponse(request))
  );
});
