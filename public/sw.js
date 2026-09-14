/* Nearo service worker — minimal and privacy-preserving.
 *
 * Goals:
 *  - Make the installed PWA open instantly and survive brief offline moments
 *    (app shell only; transfer payloads never touch any server).
 *  - Never cache API responses that could serve stale session state.
 *
 * Strategy:
 *  - Static app shell/assets: stale-while-revalidate.
 *  - Convex API / auth endpoints: network only, never cached.
 */
const CACHE = "nearo-shell-v1";
const SHELL_ASSETS = ["/", "/app", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        /* partial shell is fine; SWR fills gaps later */
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GETs.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache the coordination API or auth endpoints.
  if (
    url.hostname.endsWith("convex.cloud") ||
    url.hostname.endsWith("convex.site") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Stale-while-revalidate for everything else (hashed static assets + shell).
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
