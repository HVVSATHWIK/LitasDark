// Service Worker for LitasDark PWA
const CACHE_NAME = 'litasdark-v3.0.0';
const STATIC_CACHE = 'litasdark-static-v3.0.0';
const DYNAMIC_CACHE = 'litasdark-dynamic-v3.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/enhanced-styles.css',
  '/src/main.js',
  '/favi.png',
  '/pdfdark.jpg',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/particles.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (except for CDN resources)
  if (url.origin !== location.origin && !isCDNResource(url)) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }

        // Network request with caching
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            
            // Return offline fallback for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            throw error;
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/favi.png',
    badge: '/favi.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/favi.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favi.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LitasDark', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper functions
function isCDNResource(url) {
  const cdnDomains = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'unpkg.com'
  ];
  
  return cdnDomains.some(domain => url.hostname.includes(domain));
}

async function doBackgroundSync() {
  try {
    // Perform background tasks like uploading queued data
    console.log('Performing background sync...');
    
    // Example: sync offline actions
    const offlineActions = await getOfflineActions();
    for (const action of offlineActions) {
      await processOfflineAction(action);
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineActions() {
  // Retrieve offline actions from IndexedDB
  return [];
}

async function processOfflineAction(action) {
  // Process individual offline action
  console.log('Processing offline action:', action);
}

// Cache management
async function cleanupOldCaches() {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames.map((cacheName) => {
      if (!cacheWhitelist.includes(cacheName)) {
        return caches.delete(cacheName);
      }
    })
  );
}

// Periodic cache cleanup
setInterval(() => {
  cleanupOldCaches();
}, 24 * 60 * 60 * 1000); // Daily cleanup