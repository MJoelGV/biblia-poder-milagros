// Service Worker stub to enable registration and always fetch from network
const SW_VERSION = 'v3';
console.log('Service Worker version:', SW_VERSION);

self.addEventListener('install', event => {
    // Activate immediately
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    // Take control of all clients immediately
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    // Always fetch from network
    event.respondWith(fetch(event.request));
});
