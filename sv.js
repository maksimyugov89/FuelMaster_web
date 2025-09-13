const CACHE_NAME = 'fuelmaster-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/css/styles.css',
    '/assets/js/script.js',
    '/manifest.json',
    '/assets/img/logo.PNG',
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

// Установка сервис-воркера и кэширование
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Активация и удаление старых кэшей
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
            .catch(() => {
                // Фолбэк для оффлайн
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});
