const CACHE_NAME = "decibeldash-v1";
const ASSETS = ["/", "/index.html", "/manifest.json"];

// Install — pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — stale-while-revalidate for navigation requests, network-first for API
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin API calls (base44 SDK, Stripe, etc.)
  if (url.origin !== self.location.origin) return;

  // Navigation requests → serve cached app shell, fall back to network
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then(
        (cached) =>
          cached ||
          fetch(request).catch(() => caches.match("/index.html"))
      )
    );
    return;
  }

  // Static assets → stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
