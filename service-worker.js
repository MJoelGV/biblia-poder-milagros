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

// Deshabilitar el service worker temporalmente
self.addEventListener('fetch', event => {
  // No hacer nada, permitir que las peticiones pasen directamente a la red
  return;
});
