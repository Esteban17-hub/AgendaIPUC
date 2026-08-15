const CACHE_NAME = 'deborita-pwa-v1'; // Cambiar versión manualmente al desplegar, o usar un bundler.

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// Instalar y forzar activación inmediata
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activar y limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tomar control inmediato de todas las pestañas
  );
});

// Escuchar mensajes desde el cliente (index.html) para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. IGNORAR PETICIONES DE SUPABASE Y APIS EXTERNAS
  // Nunca interceptar peticiones a la base de datos o extensiones
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // 2. NETWORK FIRST PARA HTML Y NAVEGACIÓN
  // Siempre intentar obtener el index.html más reciente del servidor
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Si la red funciona, actualizamos el caché y devolvemos la respuesta
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Fallback offline: Servimos el index.html cacheado solo si no hay red
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 3. STALE WHILE REVALIDATE PARA ESTÁTICOS (JS, CSS, Imágenes, Fuentes)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Disparamos la petición de red en segundo plano (Revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Ignorar fallos de red en recursos estáticos si ya están cacheados
        return cachedResponse;
      });

      // Si lo tenemos en caché, respondemos inmediatamente (Stale), 
      // si no, esperamos a que la petición de red termine.
      return cachedResponse || fetchPromise;
    })
  );
});


});
