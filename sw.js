/* Vitality Inviting Tracker – Service Worker
   v1.2.4: force-refresh friendly + safer caching.
*/

// Bump this on every release to bust old cached HTML/CSS/JS.
const CACHE = "vitality_inviting_tracker_pwa_v1_2_4";

// All files are served from the repo root on GitHub Pages:
// https://<user>.github.io/<repo>/
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete old caches so users definitely get the latest UI.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Network-first for navigation (HTML). This prevents "stuck" old UIs.
  const isNavigation = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(CACHE);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match("./index.html");
          return cached || caches.match("./");
        }
      })()
    );
    return;
  }

  // Cache-first for everything else.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
