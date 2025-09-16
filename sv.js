// === FUEL MASTER SERVICE WORKER - ENHANCED ===

const CACHE_NAME = 'fuelmaster-v5'; // Увеличиваем версию
const STATIC_CACHE = 'fuelmaster-static-v5';
const DYNAMIC_CACHE = 'fuelmaster-dynamic-v5';
const IMAGE_CACHE = 'fuelmaster-images-v5';

// Добавляем более умное кеширование
const CACHE_DURATION = {
    STATIC: 30 * 24 * 60 * 60 * 1000,    // 30 дней для статики
    DYNAMIC: 24 * 60 * 60 * 1000,         // 1 день для динамического контента
    IMAGES: 7 * 24 * 60 * 60 * 1000,      // 7 дней для изображений
    API: 10 * 60 * 1000                   // 10 минут для API
};

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/assets/css/styles.css',
    '/assets/js/script.js',
    '/manifest.json'
];

// Static assets to cache
const STATIC_ASSETS = [
    '/assets/img/logo.jpg',
    '/app-ads.txt'
];

// Screenshot images (cache on demand)
const SCREENSHOT_IMAGES = [
    '/assets/img/Screenshot-1-dark.jpg',
    '/assets/img/Screenshot-2-dark.jpg',
    '/assets/img/Screenshot-3-dark.jpg',
    '/assets/img/Screenshot-4-dark.jpg',
    '/assets/img/Screenshot-5-dark.jpg',
    '/assets/img/Screenshot-6-dark.jpg',
    '/assets/img/Screenshot-7-dark.jpg',
    '/assets/img/Screenshot-8-dark.jpg',
    '/assets/img/Screenshot-9-dark.jpg',
    '/assets/img/Screenshot-10-dark.jpg',
    '/assets/img/Screenshot-11-dark.jpg',
    '/assets/img/Screenshot-12-dark.jpg',
    '/assets/img/Screenshot-1-light.jpg',
    '/assets/img/Screenshot-2-light.jpg',
    '/assets/img/Screenshot-3-light.jpg',
    '/assets/img/Screenshot-4-light.jpg',
    '/assets/img/Screenshot-5-light.jpg',
    '/assets/img/Screenshot-6-light.jpg',
    '/assets/img/Screenshot-7-light.jpg',
    '/assets/img/Screenshot-8-light.jpg',
    '/assets/img/Screenshot-9-light.jpg',
    '/assets/img/Screenshot-10-light.jpg',
    '/assets/img/Screenshot-11-light.jpg',
    '/assets/img/Screenshot-12-light.jpg'
];

// External resources that should be cached
const EXTERNAL_RESOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

// === INSTALLATION ===
self.addEventListener('install', event => {
    console.log('SW: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical resources immediately
            caches.open(STATIC_CACHE).then(cache => {
                console.log('SW: Caching critical resources');
                return cache.addAll([...CRITICAL_RESOURCES, ...STATIC_ASSETS]);
            }),
            
            // Cache external resources
            caches.open(STATIC_CACHE).then(cache => {
                console.log('SW: Caching external resources');
                return Promise.allSettled(
                    EXTERNAL_RESOURCES.map(url => 
                        cache.add(url).catch(err => {
                            console.warn(`SW: Failed to cache ${url}:`, err);
                        })
                    )
                );
            })
        ]).then(() => {
            console.log('SW: Installation completed');
            // Force activation of new service worker
            return self.skipWaiting();
        }).catch(error => {
            console.error('SW: Installation failed:', error);
        })
    );
});

// === ACTIVATION ===
self.addEventListener('activate', event => {
    console.log('SW: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName.startsWith('fuelmaster-') && 
                                   ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(cacheName);
                        })
                        .map(cacheName => {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            
            // Claim all clients
            self.clients.claim()
        ]).then(() => {
            console.log('SW: Activation completed');
        }).catch(error => {
            console.error('SW: Activation failed:', error);
        })
    );
});

// === FETCH HANDLER ===
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-http(s) requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Skip Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
    } else if (isImageRequest(request)) {
        event.respondWith(handleImageRequest(request));
    } else if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else {
        event.respondWith(handleGenericRequest(request));
    }
});

// === REQUEST HANDLERS ===

// Navigation requests (HTML pages)
async function handleNavigationRequest(request) {
    try {
        // Network first for navigation
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Network failed for navigation, trying cache');
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to offline page or index
        const fallback = await caches.match('/index.html');
        return fallback || new Response('Offline', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
}

// Image requests
async function handleImageRequest(request) {
    // Cache first for images
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(IMAGE_CACHE);
            cache.put(request, networkResponse.clone());
            
            // Limit image cache size
            await limitCacheSize(IMAGE_CACHE, 50);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Failed to fetch image:', request.url);
        
        // Return placeholder or error response
        return new Response('', { 
            status: 503, 
            statusText: 'Image unavailable' 
        });
    }
}

// Static assets (CSS, JS, fonts)
async function handleStaticAsset(request) {
    // Cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Failed to fetch static asset:', request.url);
        throw error;
    }
}

// API requests (weather, geocoding)
async function handleAPIRequest(request) {
    // Network first with timeout for API requests
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const networkResponse = await fetch(request, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (networkResponse.ok) {
            // Cache successful API responses for short time
            const cache = await caches.open(DYNAMIC_CACHE);
            const responseClone = networkResponse.clone();
            
            // Add timestamp for cache expiration
            const responseWithTimestamp = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: {
                    ...Object.fromEntries(responseClone.headers.entries()),
                    'sw-cached-at': Date.now().toString()
                }
            });
            
            cache.put(request, responseWithTimestamp);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: API request failed, trying cache');
        
        // Try cache with expiration check
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            const cachedAt = cachedResponse.headers.get('sw-cached-at');
            const cacheAge = Date.now() - parseInt(cachedAt || '0');
            
            // Use cached response if less than 10 minutes old
            if (cacheAge < 10 * 60 * 1000) {
                return cachedResponse;
            }
        }
        
        throw error;
    }
}

// Generic requests
async function handleGenericRequest(request) {
    // Stale while revalidate for other requests
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// === UTILITY FUNCTIONS ===

function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

function isImageRequest(request) {
    return request.destination === 'image' || 
           request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

function isStaticAsset(request) {
    return request.url.match(/\.(css|js|woff|woff2|ttf|eot)$/i) ||
           STATIC_ASSETS.some(asset => request.url.endsWith(asset)) ||
           EXTERNAL_RESOURCES.some(resource => request.url.startsWith(resource));
}

function isAPIRequest(request) {
    return request.url.includes('api.open-meteo.com') ||
           request.url.includes('geocode.maps.co') ||
           request.url.includes('/api/');
}

async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
        // Remove oldest items
        const itemsToDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(itemsToDelete.map(key => cache.delete(key)));
    }
}

// === MESSAGE HANDLING ===
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_INFO':
            getCacheInfo().then(info => {
                event.ports[0].postMessage(info);
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache(payload.cacheName).then(success => {
                event.ports[0].postMessage({ success });
            });
            break;
            
        case 'PREFETCH_IMAGES':
            prefetchImages(payload.urls);
            break;
    }
});

async function getCacheInfo() {
    const cacheNames = await caches.keys();
    const info = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        info[cacheName] = keys.length;
    }
    
    return info;
}

async function clearCache(cacheName) {
    try {
        await caches.delete(cacheName);
        return true;
    } catch (error) {
        console.error('SW: Failed to clear cache:', error);
        return false;
    }
}

async function prefetchImages(urls) {
    const cache = await caches.open(IMAGE_CACHE);
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
            }
        } catch (error) {
            console.warn('SW: Failed to prefetch image:', url, error);
        }
    }
}

// === BACKGROUND SYNC (if supported) ===
if ('sync' in self.registration) {
    self.addEventListener('sync', event => {
        if (event.tag === 'background-sync') {
            event.waitUntil(doBackgroundSync());
        }
    });
}

async function doBackgroundSync() {
    // Implement background sync logic here
    console.log('SW: Background sync triggered');
}

// === PUSH NOTIFICATIONS (if supported) ===
if ('push' in self.registration) {
    self.addEventListener('push', event => {
        const options = {
            body: event.data?.text() || 'Новое уведомление от FuelMaster',
            icon: '/assets/img/logo.jpg',
            badge: '/assets/img/logo.jpg',
            tag: 'fuelmaster-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'open',
                    title: 'Открыть приложение'
                },
                {
                    action: 'dismiss',
                    title: 'Закрыть'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification('FuelMaster', options)
        );
    });
    
    self.addEventListener('notificationclick', event => {
        event.notification.close();
        
        if (event.action === 'open') {
            event.waitUntil(
                clients.openWindow('/')
            );
        }
    });
}

// === ERROR HANDLING ===
self.addEventListener('error', event => {
    console.error('SW: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('SW: Unhandled promise rejection:', event.reason);
});

console.log('SW: Service Worker script loaded');
