// Bump this version whenever the app shell or bundled creative assets change.
const CACHE = "my-todo-board-shell-v15";
const APP_SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/style.css", "./css/board-theme.css", "./css/interactions.css",
  "./css/creative-assets.css", "./css/workspace.css", "./css/panels.css",
  "./js/task-row.js", "./js/app.js", "./js/paper-drag.js", "./js/dropdowns.js", "./js/panels.js", "./js/board-storage.js", "./js/calendar-motion.js", "./js/board-calendar.js", "./js/workspace.js", "./js/asset-catalog.js", "./js/pwa.js",
  "./assets/board/leaf.svg", "./assets/board/star.svg", "./assets/board/tape.svg",
  "./assets/icons/icon.svg", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png", "./assets/icons/maskable-512.png",
];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("my-todo-board-shell-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => response.ok ? response : caches.match("./index.html")).catch(() => caches.match("./index.html")));
    return;
  }
  // Cache local artwork when requested; Creative can add new assets later.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy))); }
    return response;
  })));
});
