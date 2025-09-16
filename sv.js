// === FUEL MASTER SERVICE WORKER - FIXED VERSION ===

const CACHE_NAME = 'fuelmaster-v5';
const STATIC_CACHE = 'fuelmaster-static-v5';
const DYNAMIC_CACHE = 'fuelmaster-dynamic-v5';
const IMAGE_CACHE = 'fuelmaster-images-v5';

// Умное кеширование с временными ограничениями
const CACHE_DURATION = {
    STATIC: 30 * 24 * 60 * 60 * 1000,    // 30 дней для статики
    DYNAMIC: 24 * 60 * 60 * 1000,         // 1 день для динамического контента
    IMAGES: 7 * 24 * 60 * 60 * 1000,      // 7 дней для изображений
    API: 10 * 60 * 1000                   // 10 минут для API
};

// Критические ресурсы для немедленного кеширования
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/assets/css/styles.css',
    '/assets/js/script.js',
    '/manifest.json'
];

// Статические ресурсы для кеширования
const STATIC_ASSETS = [
    '/assets/img/logo.jpg'
];

// Внешние ресурсы для кеширования
const EXTERNAL_RESOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Глобальные переменры для управления интервалами
let maintenanceInterval = null;
let cleanupInterval = null;

// === УТИЛИТЫ СОВМЕСТИМОСТИ ===

// Создание AbortSignal с поддержкой старых браузеров
function createAbortSignal(timeout) {
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        return AbortSignal.timeout(timeout);
    }
    // Fallback для старых браузеров
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
}

// Безопасное кеширование с обработкой ошибок
async function safeCache(cacheName, request, response) {
    try {
        const cache = await caches.open(cacheName);
        await cache.put(request, response);
    } catch (error) {
        console.warn('SW: Failed to cache:', request.url, error.message);
        // Не прерываем выполнение из-за ошибок кеширования
    }
}

// === ФУНКЦИИ КЕШИРОВАНИЯ ===

// Проверка истечения кеша
function isCacheExpired(response, maxAge) {
    if (!response) return true;
    
    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return true;
    
    const cacheAge = Date.now() - parseInt(cachedAt);
    return cacheAge > maxAge;
}

// ИСПРАВЛЕННАЯ функция создания кешированного ответа
async function createCachedResponse(response) {
    try {
        const responseClone = response.clone();
        const headers = new Headers(responseClone.headers);
        headers.set('sw-cached-at', Date.now().toString());
        
        return new Response(responseClone.body, {
            status: responseClone.status,
            statusText: responseClone.statusText,
            headers: headers
        });
    } catch (error) {
        console.warn('SW: Failed to create cached response:', error);
        return response.clone();
    }
}

// Кеширование с учетом времени жизни
async function cacheWithExpiration(cacheName, request, response, maxAge) {
    try {
        const cache = await caches.open(cacheName);
        const responseToCache = await createCachedResponse(response);
        await cache.put(request, responseToCache);
    } catch (error) {
        console.warn('SW: Failed to cache with expiration:', request.url, error);
    }
}

// Получение из кеша с проверкой времени
async function getFromCacheWithExpiration(request, maxAge) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (!cachedResponse || isCacheExpired(cachedResponse, maxAge)) {
            return null;
        }
        
        return cachedResponse;
    } catch (error) {
        console.warn('SW: Failed to get from cache:', request.url, error);
        return null;
    }
}

// === INSTALLATION ===
self.addEventListener('install', event => {
    console.log('SW: Installing...');
    
    event.waitUntil(
        Promise.allSettled([
            // Кешируем критические ресурсы
            caches.open(STATIC_CACHE).then(cache => {
                console.log('SW: Caching critical resources');
                return cache.addAll([...CRITICAL_RESOURCES, ...STATIC_ASSETS]);
            }).catch(err => {
                console.error('SW: Failed to cache critical resources:', err);
            }),
            
            // Кешируем внешние ресурсы
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
        ]).then(results => {
            console.log('SW: Installation completed');
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                console.warn('SW: Some resources failed to cache:', failures);
            }
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
        Promise.allSettled([
            // Очищаем старые кеши
            caches.keys().then(cacheNames => {
                return Promise.allSettled(
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
            
            // Захватываем всех клиентов
            self.clients.claim(),
            
            // Кешируем оффлайн страницу
            caches.open(STATIC_CACHE).then(cache => {
                return cache.put('/offline.html', createOfflinePage());
            }).catch(err => {
                console.warn('SW: Failed to cache offline page:', err);
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
    
    // Пропускаем non-http(s) запросы
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Пропускаем Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // ИСПРАВЛЕНО: Добавлена обработка специальных маршрутов
    const specialResponse = handleSpecialRoutes(request.url);
    if (specialResponse) {
        event.respondWith(specialResponse);
        return;
    }
    
    // Обрабатываем разные типы запросов
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

// === ОБРАБОТЧИКИ ЗАПРОСОВ ===

// Навигационные запросы (HTML страницы)
async function handleNavigationRequest(request) {
    try {
        const networkResponse = await fetch(request, {
            signal: createAbortSignal(5000)
        });
        
        if (networkResponse.ok) {
            await safeCache(DYNAMIC_CACHE, request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Network failed for navigation, trying cache');
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const fallback = await caches.match('/index.html');
        return fallback || createOfflinePage();
    }
}

// УЛУЧШЕННАЯ обработка изображений
async function handleImageRequest(request) {
    try {
        const cachedResponse = await getFromCacheWithExpiration(request, CACHE_DURATION.IMAGES);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request, {
            signal: createAbortSignal(10000)
        });
        
        if (networkResponse.ok) {
            await cacheWithExpiration(IMAGE_CACHE, request, networkResponse.clone(), CACHE_DURATION.IMAGES);
            await limitCacheSize(IMAGE_CACHE, 50);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('SW: Failed to fetch image:', request.url);
        
        const staleCache = await caches.match(request);
        if (staleCache) {
            console.log('SW: Returning stale image cache');
            return staleCache;
        }
        
        return createPlaceholderImage();
    }
}

// УЛУЧШЕННАЯ обработка статических ресурсов
async function handleStaticAsset(request) {
    const cachedResponse = await getFromCacheWithExpiration(request, CACHE_DURATION.STATIC);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request, {
            signal: createAbortSignal(8000)
        });
        
        if (networkResponse.ok) {
            await cacheWithExpiration(STATIC_CACHE, request, networkResponse.clone(), CACHE_DURATION.STATIC);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Failed to fetch static asset:', request.url);
        
        const staleCache = await caches.match(request);
        if (staleCache) {
            return staleCache;
        }
        
        throw error;
    }
}

// УЛУЧШЕННАЯ обработка API запросов
async function handleAPIRequest(request) {
    try {
        const cachedResponse = await getFromCacheWithExpiration(request, CACHE_DURATION.API);
        
        if (cachedResponse) {
            // Stale-while-revalidate стратегия
            fetch(request, {
                signal: createAbortSignal(5000)
            }).then(networkResponse => {
                if (networkResponse.ok) {
                    cacheWithExpiration(DYNAMIC_CACHE, request, networkResponse, CACHE_DURATION.API);
                }
            }).catch(err => {
                console.log('SW: Background API update failed:', err);
            });
            
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request, {
            signal: createAbortSignal(8000)
        });
        
        if (networkResponse.ok) {
            await cacheWithExpiration(DYNAMIC_CACHE, request, networkResponse.clone(), CACHE_DURATION.API);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('SW: API request failed:', error.message);
        
        const staleCache = await caches.match(request);
        if (staleCache) {
            console.log('SW: Returning stale API cache');
            return staleCache;
        }
        
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

// Общие запросы
async function handleGenericRequest(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request, {
        signal: createAbortSignal(5000)
    }).then(networkResponse => {
        if (networkResponse.ok) {
            safeCache(DYNAMIC_CACHE, request, networkResponse.clone());
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

// ИСПРАВЛЕННАЯ функция ограничения размера кеша
async function limitCacheSize(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length <= maxItems) return;
        
        // Получаем временные метки и сортируем по времени
        const entriesWithTime = [];
        
        for (const request of keys) {
            const response = await cache.match(request);
            const cachedAt = response?.headers.get('sw-cached-at');
            entriesWithTime.push({
                request,
                timestamp: parseInt(cachedAt || '0')
            });
        }
        
        // Сортируем по времени (старые первыми)
        entriesWithTime.sort((a, b) => a.timestamp - b.timestamp);
        
        // Удаляем лишние (самые старые)
        const itemsToDelete = keys.length - maxItems;
        for (let i = 0; i < itemsToDelete; i++) {
            await cache.delete(entriesWithTime[i].request);
        }
        
        console.log(`SW: Cleaned ${itemsToDelete} old entries from ${cacheName}`);
    } catch (error) {
        console.warn('SW: Failed to limit cache size:', error);
    }
}

// === УПРАВЛЕНИЕ КЕШЕМ ===

// Очистка устаревшего кеша
async function cleanExpiredCache() {
    try {
        const cacheNames = await caches.keys();
        
        for (const cacheName of cacheNames) {
            if (!cacheName.startsWith('fuelmaster-')) continue;
            
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
                const response = await cache.match(request);
                let maxAge;
                
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
    } catch (error) {
        console.error('SW: Clean expired cache failed:', error);
    }
}

// Предзагрузка критических ресурсов
async function preloadCriticalResources() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const uncachedResources = [];
        
        for (const resource of CRITICAL_RESOURCES) {
            const cached = await cache.match(resource);
            if (!cached) {
                uncachedResources.push(resource);
            }
        }
        
        if (uncachedResources.length > 0) {
            console.log('SW: Preloading missing critical resources:', uncachedResources);
            await Promise.allSettled(
                uncachedResources.map(url => cache.add(url))
            );
        }
        
    } catch (error) {
        console.error('SW: Failed to preload critical resources:', error);
    }
}

// === СОЗДАНИЕ PLACEHOLDER'ОВ ===

function createPlaceholderImage() {
    const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial">
            Изображение недоступно
        </text>
    </svg>`;
    
    return new Response(svg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache'
        }
    });
}

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
                <p>Основной калькулятор все еще работает!</p>
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

// === СПЕЦИАЛЬНЫЕ МАРШРУТЫ ===

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

async function createCacheStatsPage() {
    try {
        const stats = await getCacheStats();
        
        const statsHTML = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FuelMaster - Статистика кеша</title>
            <style>
                body { font-family: Arial, sans-serif; background: #2c2c3e; color: #e0e0e0; margin: 0; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; }
                .header { text-align: center; margin-bottom: 2rem; color: #007bff; }
                .stat-card { background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 10px; margin: 1rem 0; }
                .back-btn { background: linear-gradient(90deg, #007bff, #00c4cc); color: white; text-decoration: none; padding: 10px 20px; border-radius: 25px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Статистика кеша FuelMaster</h1>
                </div>
                <div class="stat-card">
                    <strong>Всего кешей:</strong> ${stats.totalCaches}<br>
                    <strong>Общий размер:</strong> ~${Math.round(stats.totalSize / 1024)} КБ
                </div>
                ${Object.entries(stats.caches).map(([cacheName, info]) => `
                    <div class="stat-card">
                        <strong>${cacheName}</strong><br>
                        Элементов: ${info.itemCount}<br>
                        Устаревших: ${info.expiredItems}<br>
                        Размер: ~${Math.round(info.estimatedSize / 1024)} КБ
                    </div>
                `).join('')}
                <a href="/" class="back-btn">← Вернуться</a>
            </div>
        </body>
        </html>
        `;
        
        return new Response(statsHTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    } catch (error) {
        console.error('SW: Failed to create cache stats page:', error);
        return createOfflinePage();
    }
}

function createServiceWorkerInfoPage() {
    const swInfoHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FuelMaster - Service Worker</title>
        <style>
            body { font-family: Arial, sans-serif; background: #2c2c3e; color: #e0e0e0; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; }
            .header { text-align: center; margin-bottom: 2rem; color: #007bff; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 0.5rem 0; }
            .feature-list li::before { content: "✓"; color: #00c4cc; margin-right: 0.5rem; }
            .back-btn { background: linear-gradient(90deg, #007bff, #00c4cc); color: white; text-decoration: none; padding: 10px 20px; border-radius: 25px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Service Worker FuelMaster</h1>
            </div>
            <h3>Активные функции:</h3>
            <ul class="feature-list">
                <li>Кеширование критических ресурсов</li>
                <li>Оффлайн режим</li>
                <li>Умное управление кешем</li>
                <li>Автоматическая очистка</li>
                <li>Обработка изображений</li>
                <li>Push-уведомления</li>
            </ul>
            <a href="/" class="back-btn">← Вернуться</a>
            <p style="text-align: center; margin-top: 2rem; opacity: 0.7;">
                Версия: ${CACHE_NAME}
            </p>
        </div>
    </body>
    </html>
    `;
    
    return new Response(swInfoHTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// === ОБРАБОТКА СООБЩЕНИЙ ===

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
    try {
        const cacheNames = await caches.keys();
        const info = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            info[cacheName] = keys.length;
        }
        
        return info;
    } catch (error) {
        console.error('SW: Failed to get cache info:', error);
        return {};
    }
}

async function clearCache(cacheName) {
    try {
        if (cacheName) {
            await caches.delete(cacheName);
            console.log('SW: Cleared cache:', cacheName);
            return true;
        } else {
            // Очищаем все кеши FuelMaster
            const cacheNames = await caches.keys();
            const fuelMasterCaches = cacheNames.filter(name => name.startsWith('fuelmaster-'));
            await Promise.all(fuelMasterCaches.map(name => caches.delete(name)));
            console.log('SW: Cleared all caches');
            return true;
        }
    } catch (error) {
        console.error('SW: Failed to clear cache:', error);
        return false;
    }
}

async function prefetchImages(urls) {
    try {
        const cache = await caches.open(IMAGE_CACHE);
        
        const results = await Promise.allSettled(
            urls.map(async url => {
                const response = await fetch(url, { signal: createAbortSignal(5000) });
                if (response.ok) {
                    await cache.put(url, response);
                    return url;
                }
                throw new Error(`Failed to fetch ${url}`);
            })
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`SW: Prefetched ${successful}/${urls.length} images`);
        
    } catch (error) {
        console.warn('SW: Failed to prefetch images:', error);
    }
}

async function getCacheStats() {
    try {
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
                    // Приблизительный размер
                    const contentLength = response.headers.get('content-length');
                    cacheSize += parseInt(contentLength || '1000');
                    
                    // Проверяем истечение срока
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
    } catch (error) {
        console.error('SW: Failed to get cache stats:', error);
        return { totalCaches: 0, caches: {}, totalSize: 0 };
    }
}

// === ПЕРИОДИЧЕСКИЕ ЗАДАЧИ ===

async function performMaintenance() {
    try {
        console.log('SW: Starting maintenance tasks');
        
        // Очистка устаревшего кеша
        await cleanExpiredCache();
        
        // Ограничение размера кешей
        await limitCacheSize(IMAGE_CACHE, 50);
        await limitCacheSize(DYNAMIC_CACHE, 100);
        
        // Получение статистики
        const stats = await getCacheStats();
        console.log('SW: Current cache stats:', stats);
        
        // Если размер кеша слишком большой, очищаем старые записи
        if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
            console.log('SW: Cache size exceeded limit, cleaning up');
            await cleanOldestCacheEntries();
        }
        
        console.log('SW: Maintenance completed successfully');
        
    } catch (error) {
        console.error('SW: Maintenance failed:', error);
    }
}

async function cleanOldestCacheEntries() {
    try {
        const cacheNames = await caches.keys();
        
        for (const cacheName of cacheNames) {
            if (!cacheName.startsWith('fuelmaster-')) continue;
            
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            if (requests.length === 0) continue;
            
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
    } catch (error) {
        console.error('SW: Failed to clean oldest cache entries:', error);
    }
}

// === BACKGROUND SYNC ===
if ('sync' in self.registration) {
    self.addEventListener('sync', event => {
        if (event.tag === 'background-sync') {
            event.waitUntil(doBackgroundSync());
        }
    });
}

async function doBackgroundSync() {
    try {
        console.log('SW: Background sync triggered');
        
        await preloadCriticalResources();
        await cleanExpiredCache();
        
        console.log('SW: Background sync completed successfully');
    } catch (error) {
        console.error('SW: Background sync failed:', error);
    }
}

// === PUSH NOTIFICATIONS ===
if ('push' in self.registration) {
    self.addEventListener('push', event => {
        let notificationData = {
            title: 'FuelMaster',
            body: 'Новое уведомление от FuelMaster',
            icon: '/assets/img/logo.jpg',
            badge: '/assets/img/logo.jpg'
        };
        
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
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
            );
        }
    });
}

// === ОБРАБОТКА ОШИБОК ===
self.addEventListener('error', event => {
    console.error('SW: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('SW: Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// === ИНИЦИАЛИЗАЦИЯ ИНТЕРВАЛОВ ===

// ИСПРАВЛЕНО: Очищаем предыдущие интервалы перед созданием новых
let maintenanceInterval = null;
let cleanupInterval = null;

// Очищаем предыдущие интервалы
if (typeof maintenanceInterval !== 'undefined' && maintenanceInterval) {
    clearInterval(maintenanceInterval);
}
if (typeof cleanupInterval !== 'undefined' && cleanupInterval) {
    clearInterval(cleanupInterval);
}

// Создаем новые интервалы только если их еще нет
if (!self.maintenanceActive) {
    self.maintenanceActive = true;
    
    maintenanceInterval = setInterval(() => {
        performMaintenance();
    }, 2 * 60 * 60 * 1000);
    
    cleanupInterval = setInterval(() => {
        cleanExpiredCache().catch(err => {
            console.error('SW: Cache cleanup failed:', err);
        });
    }, 6 * 60 * 60 * 1000);
}

// === ФИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===

console.log(`SW: FuelMaster Service Worker ${CACHE_NAME} loaded successfully`);
console.log('SW: Available features:', {
    caching: true,
    offlineSupport: true,
    pushNotifications: 'push' in self.registration,
    backgroundSync: 'sync' in self.registration,
    periodicMaintenance: true,
    smartCaching: true
});

// Уведомляем клиентов о готовности SW
self.clients.matchAll().then(clients => {
    clients.forEach(client => {
        try {
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
        } catch (error) {
            console.warn('SW: Failed to send ready message to client:', error);
        }
    });
}).catch(error => {
    console.warn('SW: Failed to notify clients:', error);
});

// Запускаем первоначальное обслуживание через 30 секунд
setTimeout(() => {
    console.log('SW: Starting initial maintenance');
    performMaintenance().catch(error => {
        console.error('SW: Initial maintenance failed:', error);
    });
}, 30000);
