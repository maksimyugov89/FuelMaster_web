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

// === УЛУЧШЕННЫЕ ФУНКЦИИ КЕШИРОВАНИЯ ===

// Функция для проверки истечения кеша
function isCacheExpired(response, maxAge) {
    if (!response) return true;
    
    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return true;
    
    const cacheAge = Date.now() - parseInt(cachedAt);
    return cacheAge > maxAge;
}

// Функция для создания ответа с временной меткой
function createCachedResponse(response) {
    const headers = new Headers(response.headers);
    headers.set('sw-cached-at', Date.now().toString());
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

// Улучшенная функция для кеширования с учетом времени
async function cacheWithExpiration(cacheName, request, response, maxAge) {
    const cache = await caches.open(cacheName);
    const responseToCache = await createCachedResponse(response);
    await cache.put(request, responseToCache);
}

// Функция для получения из кеша с проверкой времени
async function getFromCacheWithExpiration(request, maxAge) {
    const cachedResponse = await caches.match(request);
    
    if (!cachedResponse || isCacheExpired(cachedResponse, maxAge)) {
        return null;
    }
    
    return cachedResponse;
}

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
            self.clients.claim(),
            
            // Cache offline page
            caches.open(STATIC_CACHE).then(cache => {
                return cache.put('/offline.html', createOfflinePage());
            })
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

// === УЛУЧШЕННЫЕ ОБРАБОТЧИКИ ЗАПРОСОВ ===

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
        return fallback || createOfflinePage();
    }
}

// Image requests - УЛУЧШЕННАЯ ВЕРСИЯ
async function handleImageRequest(request) {
    try {
        // Сначала проверяем кеш с учетом времени
        const cachedResponse = await getFromCacheWithExpiration(request, CACHE_DURATION.IMAGES);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Если в кеше нет или кеш устарел, загружаем из сети
        const networkResponse = await fetch(request, {
            signal: AbortSignal.timeout(10000) // 10 секунд таймаут
        });
        
        if (networkResponse.ok) {
            const cache = await caches.open(IMAGE_CACHE);
            // Сохраняем с временной меткой
            await cacheWithExpiration(IMAGE_CACHE, request, networkResponse.clone(), CACHE_DURATION.IMAGES);
            
            // Ограничиваем размер кеша
            await limitCacheSize(IMAGE_CACHE, 50);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('SW: Failed to fetch image:', request.url);
        
        // Возвращаем устаревший кеш если есть
        const staleCache = await caches.match(request);
        if (staleCache) {
            console.log('SW: Returning stale image cache');
            return staleCache;
        }
        
        // Или создаем placeholder изображение
        return createPlaceholderImage();
    }
}

// Static assets (CSS, JS, fonts) - УЛУЧШЕННАЯ ВЕРСИЯ
async function handleStaticAsset(request) {
    // Cache first for static assets with expiration check
    const cachedResponse = await getFromCacheWithExpiration(request, CACHE_DURATION.STATIC);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            await cacheWithExpiration(STATIC_CACHE, request, networkResponse.clone(), CACHE_DURATION.STATIC);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Failed to fetch static asset:', request.url);
        
        // Return stale cache if available
        const staleCache = await caches.match(request);
        if (staleCache) {
            return staleCache;
        }
        
        throw error;
    }
}

// API requests - УЛУЧШЕННАЯ ВЕРСИЯ
async function handleAPIRequest(request) {
    try {
        // Сначала пытаемся получить из кеша
        const cachedResponse = await getFromCacheWithExpiration(request, CACHE_DURATION.API);
        
        // Если есть валидный кеш, используем stale-while-revalidate стратегию
        if (cachedResponse) {
            // Запускаем обновление в фоне
            fetch(request, {
                signal: AbortSignal.timeout(5000)
            }).then(networkResponse => {
                if (networkResponse.ok) {
                    cacheWithExpiration(DYNAMIC_CACHE, request, networkResponse, CACHE_DURATION.API);
                }
            }).catch(err => {
                console.log('SW: Background API update failed:', err);
            });
            
            return cachedResponse;
        }
        
        // Если кеша нет, делаем сетевой запрос
        const networkResponse = await fetch(request, {
            signal: AbortSignal.timeout(8000) // Увеличиваем таймаут для API
        });
        
        if (networkResponse.ok) {
            // Сохраняем с временной меткой
            await cacheWithExpiration(DYNAMIC_CACHE, request, networkResponse.clone(), CACHE_DURATION.API);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('SW: API request failed:', error.message);
        
        // Возвращаем устаревший кеш если есть
        const staleCache = await caches.match(request);
        if (staleCache) {
            console.log('SW: Returning stale API cache');
            return staleCache;
        }
        
        // Создаем ответ-заглушку для API
        return new Response(
            JSON.stringify({ 
                error: 'API недоступен', 
                cached: false,
                timestamp: Date.now() 
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
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

// === ДОПОЛНИТЕЛЬНЫЕ СИСТЕМЫ УПРАВЛЕНИЯ КЕШЕМ ===

// Периодическая очистка устаревшего кеша
async function cleanExpiredCache() {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        if (!cacheName.startsWith('fuelmaster-')) continue;
        
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            let maxAge;
            
            // Определяем максимальный возраст в зависимости от типа кеша
            if (cacheName.includes('static')) {
                maxAge = CACHE_DURATION.STATIC;
            } else if (cacheName.includes('images')) {
                maxAge = CACHE_DURATION.IMAGES;
            } else if (cacheName.includes('dynamic')) {
                maxAge = CACHE_DURATION.DYNAMIC;
            } else {
                maxAge = CACHE_DURATION.API;
            }
            
            if (isCacheExpired(response, maxAge)) {
                await cache.delete(request);
                console.log('SW: Removed expired cache entry:', request.url);
            }
        }
    }
}

// Запускаем очистку кеша каждые 6 часов
setInterval(() => {
    cleanExpiredCache().catch(err => {
        console.error('SW: Cache cleanup failed:', err);
    });
}, 6 * 60 * 60 * 1000);

// Умная предзагрузка критических ресурсов
async function preloadCriticalResources() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        
        // Предзагружаем только те ресурсы, которых нет в кеше
        const uncachedResources = [];
        
        for (const resource of CRITICAL_RESOURCES) {
            const cached = await cache.match(resource);
            if (!cached) {
                uncachedResources.push(resource);
            }
        }
        
        if (uncachedResources.length > 0) {
            console.log('SW: Preloading missing critical resources:', uncachedResources);
            await cache.addAll(uncachedResources);
        }
        
    } catch (error) {
        console.error('SW: Failed to preload critical resources:', error);
    }
}

// Функция для создания placeholder изображения
function createPlaceholderImage() {
    // Создаем простое SVG изображение как placeholder
    const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">Изображение недоступно</text>
    </svg>`;
    
    return new Response(svg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml'
        }
    });
}

// === СОЗДАНИЕ ОФФЛАЙН СТРАНИЦЫ ===
function createOfflinePage() {
    const offlineHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FuelMaster - Оффлайн</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #2c2c3e, #4a4a6a);
                color: #e0e0e0;
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
            }
            .offline-container {
                max-width: 400px;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: bounce 2s infinite;
            }
            .offline-title {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                color: #007bff;
                font-weight: 700;
            }
            .offline-message {
                margin-bottom: 2rem;
                line-height: 1.6;
                opacity: 0.9;
            }
            .retry-btn {
                background: linear-gradient(90deg, #007bff, #00c4cc);
                border: none;
                color: white;
                padding: 12px 25px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 1rem;
                font-weight: bold;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
            }
            .retry-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📱⛽</div>
            <h1 class="offline-title">FuelMaster</h1>
            <div class="offline-message">
                <p>Нет подключения к интернету</p>
                <p>Некоторые функции могут быть недоступны, но основной калькулятор работает!</p>
            </div>
            <button class="retry-btn" onclick="window.location.reload()">
                Повторить подключение
            </button>
        </div>
    </body>
    </html>
    `;
    
    return new Response(offlineHTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// === УЛУЧШЕННАЯ ОБРАБОТКА СООБЩЕНИЙ ===
self.addEventListener('message', async event => {
    const { type, payload } = event.data || {};
    
    try {
        switch (type) {
            case 'SKIP_WAITING':
                await self.skipWaiting();
                break;
                
            case 'GET_CACHE_INFO':
                const info = await getCacheInfo();
                event.ports[0]?.postMessage({ success: true, data: info });
                break;
                
            case 'CLEAR_CACHE':
                const success = await clearCache(payload?.cacheName);
                event.ports[0]?.postMessage({ success });
                break;
                
            case 'CLEAR_EXPIRED_CACHE':
                await cleanExpiredCache();
                event.ports[0]?.postMessage({ success: true });
                break;
                
            case 'PREFETCH_IMAGES':
                if (payload?.urls) {
                    await prefetchImages(payload.urls);
                    event.ports[0]?.postMessage({ success: true });
                }
                break;
                
            case 'PRELOAD_CRITICAL':
                await preloadCriticalResources();
                event.ports[0]?.postMessage({ success: true });
                break;
                
            case 'GET_CACHE_STATS':
                const stats = await getCacheStats();
                event.ports[0]?.postMessage({ success: true, data: stats });
                break;
                
            default:
                console.warn('SW: Unknown message type:', type);
                event.ports[0]?.postMessage({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('SW: Message handling error:', error);
        event.ports[0]?.postMessage({ success: false, error: error.message });
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

// Расширенная информация о кеше
async function getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {
        totalCaches: cacheNames.length,
        caches: {},
        totalSize: 0
    };
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        let cacheSize = 0;
        let expiredItems = 0;
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                // Приблизительный размер (размер заголовков + URL)
                cacheSize += parseInt(response.headers.get('content-length') || '1000');
                
                // Проверяем истечение
                if (isCacheExpired(response, CACHE_DURATION.DYNAMIC)) {
                    expiredItems++;
                }
            }
        }
        
        stats.caches[cacheName] = {
            itemCount: keys.length,
            expiredItems,
            estimatedSize: cacheSize
        };
        
        stats.totalSize += cacheSize;
    }
    
    return stats;
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
    
    try {
        // Пытаемся обновить критически важные ресурсы
        await preloadCriticalResources();
        
        // Очищаем устаревший кеш
        await cleanExpiredCache();
        
        console.log('SW: Background sync completed successfully');
    } catch (error) {
        console.error('SW: Background sync failed:', error);
    }
}

// === PUSH NOTIFICATIONS (if supported) ===
if ('push' in self.registration) {
    self.addEventListener('push', event => {
        let notificationData = {
            title: 'FuelMaster',
            body: 'Новое уведомление от FuelMaster',
            icon: '/assets/img/logo.jpg',
            badge: '/assets/img/logo.jpg'
        };
        
        // Парсим данные если они есть
        if (event.data) {
            try {
                const data = event.data.json();
                notificationData = { ...notificationData, ...data };
            } catch (e) {
                notificationData.body = event.data.text() || notificationData.body;
            }
        }
        
        const options = {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: 'fuelmaster-notification',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            actions: [
                {
                    action: 'open',
                    title: 'Открыть приложение',
                    icon: '/assets/img/logo.jpg'
                },
                {
                    action: 'dismiss',
                    title: 'Закрыть'
                }
            ],
            data: {
                url: notificationData.url || '/',
                timestamp: Date.now()
            }
        };
        
        event.waitUntil(
            self.registration.showNotification(notificationData.title, options)
        );
    });
    
    self.addEventListener('notificationclick', event => {
        event.notification.close();
        
        const notificationData = event.notification.data || {};
        const urlToOpen = notificationData.url || '/';
        
        if (event.action === 'open' || !event.action) {
            event.waitUntil(
                clients.matchAll({ type: 'window' }).then(clientList => {
                    // Пытаемся найти уже открытое окно с приложением
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Если окна нет, открываем новое
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
            );
        }
        // Для action 'dismiss' просто закрываем уведомление (уже сделано выше)
    });
}

// === ERROR HANDLING ===
self.addEventListener('error', event => {
    console.error('SW: Error occurred:', event.error);
    
    // Можно добавить логирование ошибок в аналитику
    // trackError('service_worker_error', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('SW: Unhandled promise rejection:', event.reason);
    
    // Предотвращаем показ ошибки в консоли (по желанию)
    event.preventDefault();
    
    // Можно добавить логирование ошибок в аналитику
    // trackError('service_worker_unhandled_rejection', event.reason);
});

// === ДОПОЛНИТЕЛЬНЫЕ ОБРАБОТЧИКИ СОБЫТИЙ ===

// Обработка события beforeinstallprompt (хоть оно и не в SW, но для полноты)
self.addEventListener('beforeinstallprompt', event => {
    console.log('SW: App can be installed');
});

// Обработка изменения состояния соединения
self.addEventListener('online', event => {
    console.log('SW: Device is back online');
    
    // Когда устройство снова онлайн, пытаемся обновить кеш
    preloadCriticalResources().catch(err => {
        console.error('SW: Failed to preload after coming online:', err);
    });
    
    // Уведомляем все открытые клиенты о восстановлении соединения
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'CONNECTIVITY_CHANGED',
                online: true,
                timestamp: Date.now()
            });
        });
    });
});

self.addEventListener('offline', event => {
    console.log('SW: Device is offline');
    
    // Уведомляем все открытые клиенты о потере соединения
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'CONNECTIVITY_CHANGED',
                online: false,
                timestamp: Date.now()
            });
        });
    });
});

// === ПЕРИОДИЧЕСКИЕ ЗАДАЧИ ===

// Функция для выполнения периодического обслуживания
async function performMaintenance() {
    try {
        console.log('SW: Starting maintenance tasks');
        
        // 1. Очистка устаревшего кеша
        await cleanExpiredCache();
        
        // 2. Ограничение размера кешей
        await limitCacheSize(IMAGE_CACHE, 50);
        await limitCacheSize(DYNAMIC_CACHE, 100);
        
        // 3. Обновление статистики использования
        const stats = await getCacheStats();
        console.log('SW: Current cache stats:', stats);
        
        // 4. Если общий размер кеша слишком большой, очищаем старые записи
        if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
            console.log('SW: Cache size exceeded limit, cleaning up');
            await cleanOldestCacheEntries();
        }
        
        console.log('SW: Maintenance completed successfully');
        
    } catch (error) {
        console.error('SW: Maintenance failed:', error);
    }
}

// Функция для очистки самых старых записей в кеше
async function cleanOldestCacheEntries() {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        if (!cacheName.startsWith('fuelmaster-')) continue;
        
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        // Создаем массив с временными метками
        const entriesWithTimestamp = [];
        
        for (const request of requests) {
            const response = await cache.match(request);
            const cachedAt = response?.headers.get('sw-cached-at');
            
            entriesWithTimestamp.push({
                request,
                timestamp: parseInt(cachedAt || '0')
            });
        }
        
        // Сортируем по времени (старые первыми)
        entriesWithTimestamp.sort((a, b) => a.timestamp - b.timestamp);
        
        // Удаляем 20% самых старых записей
        const itemsToDelete = Math.floor(entriesWithTimestamp.length * 0.2);
        
        for (let i = 0; i < itemsToDelete; i++) {
            await cache.delete(entriesWithTimestamp[i].request);
        }
        
        console.log(`SW: Cleaned ${itemsToDelete} old entries from ${cacheName}`);
    }
}

// Запускаем обслуживание каждые 2 часа
setInterval(() => {
    performMaintenance();
}, 2 * 60 * 60 * 1000);

// === ФУНКЦИИ ДЛЯ РАБОТЫ С КЛИЕНТАМИ ===

// Отправка сообщения всем клиентам
async function broadcastToClients(message) {
    const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
    });
    
    clients.forEach(client => {
        try {
            client.postMessage(message);
        } catch (error) {
            console.warn('SW: Failed to send message to client:', error);
        }
    });
}

// Уведомление об обновлении Service Worker
self.addEventListener('controllerchange', () => {
    console.log('SW: Controller changed - new SW is active');
});

// === ОБРАБОТКА СПЕЦИАЛЬНЫХ URL ===

// Обработчик для специальных маршрутов приложения
function handleSpecialRoutes(url) {
    const pathname = new URL(url).pathname;
    
    switch (pathname) {
        case '/offline':
        case '/offline.html':
            return createOfflinePage();
            
        case '/cache-stats':
            return createCacheStatsPage();
            
        case '/sw-info':
            return createServiceWorkerInfoPage();
            
        default:
            return null;
    }
}

// Создание страницы со статистикой кеша
async function createCacheStatsPage() {
    const stats = await getCacheStats();
    
    const statsHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FuelMaster - Статистика кеша</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #2c2c3e, #4a4a6a);
                color: #e0e0e0;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.1);
                padding: 2rem;
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            .header {
                text-align: center;
                margin-bottom: 2rem;
                color: #007bff;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            .stat-card {
                background: rgba(0, 0, 0, 0.2);
                padding: 1rem;
                border-radius: 10px;
                border-left: 4px solid #007bff;
            }
            .stat-title {
                font-size: 0.9rem;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }
            .stat-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: #00c4cc;
            }
            .cache-details {
                background: rgba(0, 0, 0, 0.1);
                padding: 1rem;
                border-radius: 10px;
                margin-top: 1rem;
            }
            .back-btn {
                display: inline-block;
                background: linear-gradient(90deg, #007bff, #00c4cc);
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 25px;
                margin-top: 1rem;
            }
            .back-btn:hover {
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Статистика кеша FuelMaster</h1>
                <p>Актуальная информация о состоянии кеша Service Worker</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">Всего кешей</div>
                    <div class="stat-value">${stats.totalCaches}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Общий размер (приблизительно)</div>
                    <div class="stat-value">${Math.round(stats.totalSize / 1024)} КБ</div>
                </div>
            </div>
            
            <div class="cache-details">
                <h3>Детали по кешам:</h3>
                ${Object.entries(stats.caches).map(([cacheName, info]) => `
                    <div style="margin: 1rem 0; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 5px;">
                        <strong>${cacheName}</strong><br>
                        Элементов: ${info.itemCount}<br>
                        Устаревших: ${info.expiredItems}<br>
                        Размер: ~${Math.round(info.estimatedSize / 1024)} КБ
                    </div>
                `).join('')}
            </div>
            
            <a href="/" class="back-btn">← Вернуться к приложению</a>
        </div>
    </body>
    </html>
    `;
    
    return new Response(statsHTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// Создание информационной страницы о Service Worker
function createServiceWorkerInfoPage() {
    const swInfoHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FuelMaster - Информация о Service Worker</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #2c2c3e, #4a4a6a);
                color: #e0e0e0;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.1);
                padding: 2rem;
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            .header {
                text-align: center;
                margin-bottom: 2rem;
                color: #007bff;
            }
            .info-section {
                background: rgba(0, 0, 0, 0.1);
                padding: 1rem;
                border-radius: 10px;
                margin-bottom: 1rem;
                border-left: 4px solid #00c4cc;
            }
            .feature-list {
                list-style: none;
                padding: 0;
            }
            .feature-list li {
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .feature-list li:last-child {
                border-bottom: none;
            }
            .feature-list li::before {
                content: "✓";
                color: #00c4cc;
                font-weight: bold;
                margin-right: 0.5rem;
            }
            .back-btn {
                display: inline-block;
                background: linear-gradient(90deg, #007bff, #00c4cc);
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 25px;
                margin-top: 1rem;
            }
            .version-info {
                text-align: center;
                opacity: 0.7;
                font-size: 0.9rem;
                margin-top: 2rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚙️ Service Worker FuelMaster</h1>
                <p>Информация о возможностях и состоянии</p>
            </div>
            
            <div class="info-section">
                <h3>🚀 Активные функции:</h3>
                <ul class="feature-list">
                    <li>Кеширование критических ресурсов</li>
                    <li>Оффлайн режим с красивой страницей</li>
                    <li>Умное управление временем жизни кеша</li>
                    <li>Автоматическая очистка устаревших данных</li>
                    <li>Обработка изображений с placeholder'ами</li>
                    <li>Stale-while-revalidate для API запросов</li>
                    <li>Push-уведомления (если поддерживается)</li>
                    <li>Background Sync (если поддерживается)</li>
                    <li>Периодическое обслуживание кеша</li>
                    <li>Детальная статистика использования</li>
                </ul>
            </div>
            
            <div class="info-section">
                <h3>📊 Типы кешей:</h3>
                <p><strong>Статический кеш:</strong> CSS, JS, шрифты (срок жизни: 30 дней)</p>
                <p><strong>Динамический кеш:</strong> HTML страницы (срок жизни: 1 день)</p>
                <p><strong>Кеш изображений:</strong> Скриншоты, иконки (срок жизни: 7 дней)</p>
                <p><strong>API кеш:</strong> Данные погоды и геолокации (срок жизни: 10 минут)</p>
            </div>
            
            <div class="info-section">
                <h3>🔧 Управление:</h3>
                <p>Service Worker автоматически управляет кешем, но вы можете:</p>
                <ul class="feature-list">
                    <li>Посмотреть <a href="/cache-stats" style="color: #00c4cc;">статистику кеша</a></li>
                    <li>Обновить страницу для получения новой версии</li>
                    <li>Очистить кеш через DevTools браузера</li>
                </ul>
            </div>
            
            <a href="/" class="back-btn">← Вернуться к приложению</a>
            
            <div class="version-info">
                Версия Service Worker: ${CACHE_NAME}<br>
                Последнее обновление: ${new Date().toLocaleString('ru-RU')}
            </div>
        </div>
    </body>
    </html>
    `;
    
    return new Response(swInfoHTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// === ФИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===

// Логируем успешную загрузку Service Worker
console.log(`SW: FuelMaster Service Worker ${CACHE_NAME} loaded successfully`);
console.log('SW: Available features:', {
    caching: true,
    offlineSupport: true,
    pushNotifications: 'push' in self.registration,
    backgroundSync: 'sync' in self.registration,
    periodicMaintenance: true,
    smartCaching: true
});

// Отправляем сообщение о готовности всем клиентам
self.clients.matchAll().then(clients => {
    clients.forEach(client => {
        client.postMessage({
            type: 'SW_READY',
            version: CACHE_NAME,
            features: {
                caching: true,
                offlineSupport: true,
                pushNotifications: 'push' in self.registration,
                backgroundSync: 'sync' in self.registration
            },
            timestamp: Date.now()
        });
    });
});

// Запускаем первоначальное обслуживание через 30 секунд после загрузки
setTimeout(() => {
    console.log('SW: Starting initial maintenance');
    performMaintenance();
}, 30000);
