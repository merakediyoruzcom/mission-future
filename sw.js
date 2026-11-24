/* Mission: Future — Offline-First Service Worker */
const CACHE = 'mission-future-v3';
const ASSETS = [
  './',
  './index.html',
  './teacher.html',
  './manifest.webmanifest',
  './icon.svg',
  './css/style.css',
  './css/teacher.css',
  './js/data.js',
  './js/tracker.js',
  './js/audio.js',
  './js/profile.js',
  './js/scenarios.js',
  './js/scene.js',
  './js/game.js',
  './js/teacher.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
