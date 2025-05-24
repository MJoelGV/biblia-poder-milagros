// Nombre de la caché
const CACHE_NAME = 'biblia-audio-v1';

// Archivos para cachear
const urlsToCache = [
  '/',
  'reproductor-simple.html',
  'manifest.json',
  'icons/pymicon.png',
  // Agrega aquí otros recursos estáticos que quieras cachear
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  // Realiza la instalación
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  // Eliminar cachés antiguas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Devuelve true si deseas eliminar esta caché
            return cacheName.startsWith('biblia-') && cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// Intercepta las peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve la respuesta en caché o realiza la petición
        return response || fetch(event.request);
      })
  );
});

// Manejo de mensajes del cliente para la reproducción en segundo plano
self.addEventListener('message', event => {
  if (event.data.action === 'play') {
    // Lógica para manejar la reproducción en segundo plano
    console.log('Reproduciendo en segundo plano:', event.data.audioUrl);
  } else if (event.data.action === 'pause') {
    // Lógica para pausar la reproducción
    console.log('Reproducción pausada');
  }
});
