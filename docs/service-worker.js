// Service Worker for offline support
const SW_VERSION = 'v4';
console.log('Service Worker version:', SW_VERSION);
const CACHE_NAME = 'biblia-app-cache-v4';
const PRECACHE_URLS = [
  '/', '/index.html', '/lectura.html', '/share.html', '/audio.html',
  '/diccionario.html', '/memorizados.html', '/historias.html', '/bookmarks.html',
  '/comments.html', '/temas.html', '/topics.html', '/manifest.json',
  '/icons/pymicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME)
           .map(key => caches.delete(key))
    ))
    .then(() => self.clients.claim())
  );
});

// Fetch handler: network-first for page navigations, cache-first for other requests
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Use network-first for page navigations
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('/index.html'))
    );
    return;
  }
  // Cache-first for other requests
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      });
    })
  );
});
