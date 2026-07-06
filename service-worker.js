/* ============================================================
   service-worker.js — offline caching for reading
   Cache-first for the app shell; network-first for brief.json
   so the latest Friday update shows when online.
   ============================================================ */

const CACHE = 'manifesting-me-v2';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/store.js',
  './js/gate.js',
  './js/brief.js',
  './js/abundance.js',
  './js/spirituality.js',
  './js/love.js',
  './js/app.js',
  './sections/brief.html',
  './sections/health.html',
  './sections/abundance.html',
  './sections/spirituality.html',
  './sections/business.html',
  './sections/love.html',
  './sections/home.html',
  './data/brief.json',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for the weekly brief data (always want freshest)
  if (url.pathname.endsWith('brief.json')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Same-origin app files (html/js/css/sections): network-first with cache fallback.
  // This guarantees the freshest code whenever online, and offline still works from cache.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (e.request.method === 'GET' && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cross-origin (fonts, etc.): cache-first.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      return res;
    }).catch(() => cached))
  );
});
