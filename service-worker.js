// Service Worker for offline support
const SW_VERSION = 'v6';
console.log('Service Worker version:', SW_VERSION);
const CACHE_NAME = 'biblia-app-cache-v6';

// Cache estático para recursos principales
const STATIC_CACHE = 'biblia-static-v6';
// Cache dinámico para contenido generado
const DYNAMIC_CACHE = 'biblia-dynamic-v6';
// Cache para datos bíblicos
const DATA_CACHE = 'biblia-data-v6';

// Recursos esenciales para funcionamiento básico (descarga inmediata)
const ESSENTIAL_URLS = [
  '/',
  '/index.html',
  '/lectura.html',
  '/manifest.json',
  '/css/menu-styles.css',
  '/js/menu.js',
  '/js/search.js',
  '/icons/pymicon.png',
  '/diccionario.xml',
  // Todas las páginas de la app
  '/audio.html',
  '/memorizados.html',
  '/historias.html',
  '/bookmarks.html',
  '/comments.html',
  '/temas.html',
  '/topics.html',
  '/share.html',
  '/diccionario.html',
  // CSS y JS adicionales
  '/css/styles.css',
  '/js/app.js',
  '/js/pericopas.js',
  '/js/temas.js',
  '/js/diccionario.js',
  '/js/audio.js',
  '/js/memorizados.js',
  '/js/historias.js',
  '/js/bookmarks.js',
  '/js/comments.js'
];

// Recursos bíblicos completos (descarga progresiva)
const BIBLE_DATA_URLS = [
  '/biblia-files/Reina-Valera-1960.xmm',
  '/biblia-files/Dios-Habla-Hoy.xmm',
  '/biblia-files/La-Biblia-de-Las-Americas.xmm',
  '/biblia-files/Nueva-Traduccion-Viviente.xmm',
  '/biblia-files/TLA.xmm',
  '/pericopas-datos-completo.js',
  '/biblia-files/temas-versiculos.xml',
  '/biblia-files/titulos-antiguo-testamento.xml'
];

// Muestras de audio para demostración (solo algunos capítulos populares)
const AUDIO_SAMPLE_URLS = [
  // Eliminamos muestras de audio para reducir tamaño
  // Si quieres algunas muestras, descomenta las siguientes líneas:
  // '/audio/genesis_01.mp3',
  // '/audio/psalm_23.mp3'
];

// Recursos adicionales (descarga lazy)
const ADDITIONAL_URLS = [
  // Ya están incluidas en ESSENTIAL_URLS, pero mantenemos por compatibilidad
  '/css/styles.css',
  '/js/app.js',
  '/js/pericopas.js',
  '/js/temas.js',
  '/js/diccionario.js',
  '/js/audio.js',
  '/js/memorizados.js',
  '/js/historias.js',
  '/js/bookmarks.js',
  '/js/comments.js'
];

// Recursos externos para cachear
const EXTERNAL_RESOURCES = [
  'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'
];

self.addEventListener('install', event => {
  console.log('Installing Service Worker v5...');
  event.waitUntil(
    Promise.all([
      // 1. Cache esencial inmediato (funcionamiento básico)
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching essential resources...');
        return cache.addAll(ESSENTIAL_URLS);
      }),
      // 2. Cache recursos externos
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching external resources...');
        return Promise.all(
          EXTERNAL_RESOURCES.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn('Failed to cache external resource:', url);
            }).catch(err => {
              console.warn('Error caching external resource:', url, err);
            })
          )
        );
      })
    ])
    .then(() => {
      console.log('Essential resources cached successfully');
      // Iniciar descarga progresiva de datos bíblicos en background
      return progressiveCacheBibleData();
    })
    .then(() => {
      console.log('Service Worker v5 installed successfully');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('Service Worker installation failed:', error);
    })
  );
});

// Descarga progresiva de datos bíblicos grandes
function progressiveCacheBibleData() {
  console.log('Starting progressive Bible data download...');
  
  // Notificar al cliente sobre el progreso
  function notifyProgress(current, total, message) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'OFFLINE_PROGRESS',
          current: current,
          total: total,
          message: message
        });
      });
    });
  }
  
  // Notificar completion
  function notifyComplete() {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'OFFLINE_COMPLETE'
        });
      });
    });
  }
  
  // Descargar en lotes para no bloquear
  const batchSize = 2; // 2 archivos a la vez
  let currentIndex = 0;
  const totalFiles = BIBLE_DATA_URLS.length + AUDIO_SAMPLE_URLS.length;
  
  notifyProgress(0, totalFiles, 'Preparando descarga de biblias...');
  
  function downloadNextBatch() {
    // Primero descargar datos bíblicos
    if (currentIndex < BIBLE_DATA_URLS.length) {
      const batch = BIBLE_DATA_URLS.slice(currentIndex, currentIndex + batchSize);
      currentIndex += batchSize;
      
      if (batch.length === 0) {
        // Pasar a audios si terminamos los datos
        return downloadAudioSamples();
      }
      
      const currentProgress = currentIndex - batch.length + batch.length;
      const fileName = batch.map(url => url.split('/').pop()).join(', ');
      notifyProgress(currentProgress, totalFiles, `Descargando: ${fileName}`);
      
      return caches.open(DATA_CACHE)
        .then(cache => {
          return Promise.all(
            batch.map(url => 
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                  console.warn('Failed to cache Bible data:', url);
                })
                .catch(err => {
                  console.warn('Error downloading Bible data:', url, err);
                })
            )
          );
        })
        .then(() => {
          // Pequeña pausa entre lotes para no sobrecargar
          return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(downloadNextBatch);
    } else {
      // Terminamos datos, ahora descargar muestras de audio
      return downloadAudioSamples();
    }
  }
  
  function downloadAudioSamples() {
    notifyProgress(BIBLE_DATA_URLS.length, totalFiles, 'Descargando muestras de audio...');
    
    // Descargar todas las muestras de audio de una vez (son pocas)
    return caches.open(DATA_CACHE)
      .then(cache => {
        return Promise.all(
          AUDIO_SAMPLE_URLS.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                console.warn('Failed to cache audio sample:', url);
              })
              .catch(err => {
                console.warn('Error downloading audio sample:', url, err);
              })
          )
        );
      })
      .then(() => {
        console.log('All Bible data and audio samples cached successfully');
        notifyComplete();
      });
  }
  
  return downloadNextBatch();
}

self.addEventListener('activate', event => {
  console.log('Activating Service Worker v5...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          // Eliminar cachés antiguos
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== DATA_CACHE) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker v5 activated');
      return self.clients.claim();
    })
    .catch(error => {
      console.error('Service Worker activation failed:', error);
    })
  );
});

// Estrategias de caché avanzadas
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Estrategia: Cache First para recursos estáticos
  if (isStaticResource(event.request)) {
    event.respondWith(
      caches.open(STATIC_CACHE)
        .then(cache => cache.match(event.request))
        .then(response => {
          return response || fetchAndCache(event.request, STATIC_CACHE);
        })
    );
  }
  // Estrategia: Cache First con fallback para datos bíblicos
  else if (isDataResource(event.request)) {
    event.respondWith(
      caches.open(DATA_CACHE)
        .then(cache => cache.match(event.request))
        .then(response => {
          if (response) {
            return response;
          }
          return fetchAndCache(event.request, DATA_CACHE);
        })
    );
  }
  // Estrategia especial para archivos de audio
  else if (isAudioResource(event.request)) {
    event.respondWith(
      caches.open(DATA_CACHE)
        .then(cache => cache.match(event.request))
        .then(response => {
          // Si está en caché (muestras), usarlo
          if (response) {
            return response;
          }
          // Si no, intentar descargar y cachear para uso futuro
          return fetch(event.request).then(audioResponse => {
            if (audioResponse.ok) {
              // Solo cachear si es un archivo pequeño (< 5MB)
              const contentLength = audioResponse.headers.get('content-length');
              if (contentLength && parseInt(contentLength) < 5 * 1024 * 1024) {
                const audioResponseClone = audioResponse.clone();
                caches.open(DATA_CACHE).then(cache => {
                  cache.put(event.request, audioResponseClone);
                });
              }
            }
            return audioResponse;
          });
        })
    );
  }
  // Estrategia: Network First para páginas HTML
  else if (isHTMLPage(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback a versión offline o página principal
          return caches.match(event.request) || caches.match('/index.html');
        })
    );
  }
  // Estrategia: Stale While Revalidate para otros recursos
  else {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.match(event.request))
        .then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              const networkResponseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(event.request, networkResponseClone));
            }
            return networkResponse;
          });
          return response || fetchPromise;
        })
    );
  }
});

// Funciones auxiliares
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/css/') || 
         url.pathname.includes('/js/') || 
         url.pathname.includes('/icons/') ||
         url.pathname.includes('.png') ||
         url.pathname.includes('.jpg') ||
         url.pathname.includes('.jpeg') ||
         url.pathname.includes('.svg') ||
         url.pathname === '/manifest.json';
}

function isDataResource(request) {
  const url = new URL(request.url);
  return url.pathname.includes('.xml') || 
         url.pathname.includes('.json') ||
         url.pathname.includes('diccionario.xml') ||
         url.pathname.includes('pericopas-datos');
}

function isAudioResource(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/audio/') || 
         url.pathname.includes('.mp3') ||
         url.pathname.includes('.wav') ||
         url.pathname.includes('.ogg');
}

function isHTMLPage(request) {
  const url = new URL(request.url);
  return url.pathname.includes('.html') || url.pathname.endsWith('/');
}

function fetchAndCache(request, cacheName) {
  return fetch(request).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const responseClone = response.clone();
    caches.open(cacheName)
      .then(cache => cache.put(request, responseClone));
    return response;
  });
}

// Background Sync para datos dinámicos
self.addEventListener('sync', event => {
  if (event.tag === 'sync-bible-data') {
    event.waitUntil(syncBibleData());
  }
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

// Verificar actualizaciones periódicamente
function checkForUpdates() {
  console.log('Checking for Bible data updates...');
  
  // Lista de archivos críticos que deben verificarse
  const criticalFiles = [
    '/biblia-files/Reina-Valera-1960.xmm',
    '/biblia-files/Dios-Habla-Hoy.xmm',
    '/biblia-files/La-Biblia-de-Las-Americas.xmm',
    '/biblia-files/Nueva-Traduccion-Viviente.xmm',
    '/biblia-files/TLA.xmm',
    '/diccionario.xml',
    '/pericopas-datos-completo.js'
  ];
  
  return Promise.all(
    criticalFiles.map(url => {
      return fetch(url, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            return caches.open(DATA_CACHE).then(cache => {
              return cache.match(url).then(cachedResponse => {
                if (!cachedResponse) {
                  // No está cacheado, descargarlo
                  return cache.put(url, response.clone());
                }
                
                // Comparar ETags o Last-Modified si están disponibles
                const serverETag = response.headers.get('etag');
                const serverLastModified = response.headers.get('last-modified');
                const cachedETag = cachedResponse.headers.get('etag');
                const cachedLastModified = cachedResponse.headers.get('last-modified');
                
                // Si hay diferencia, actualizar
                if ((serverETag && serverETag !== cachedETag) ||
                    (serverLastModified && serverLastModified !== cachedLastModified)) {
                  console.log(`Updating outdated file: ${url}`);
                  return cache.put(url, response.clone()).then(() => {
                    // Notificar a los clientes sobre la actualización
                    notifyClientsUpdate(url);
                  });
                }
              });
            });
          }
        })
        .catch(err => {
          console.warn('Error checking update for:', url, err);
        });
    })
  ).then(() => {
    console.log('Update check completed');
  });
}

// Notificar a los clientes sobre actualizaciones
function notifyClientsUpdate(updatedFile) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONTENT_UPDATE',
        file: updatedFile,
        message: 'Contenido bíblico actualizado',
        timestamp: Date.now()
      });
    });
  });
}

function syncBibleData() {
  // Sincronizar datos cuando haya conexión
  return caches.open(DATA_CACHE).then(cache => {
    // Aquí podrías implementar lógica para actualizar datos bíblicos
    console.log('Syncing bible data...');
  });
}

// Notificaciones push (opcional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/icons/pymicon.png',
    badge: '/icons/pymicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Biblia de Poder y Milagros', options)
  );
});
