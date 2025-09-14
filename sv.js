const CACHE_NAME = 'fuelmaster-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/assets/css/styles.css',
    '/assets/js/script.js',
    '/manifest.json',
    '/assets/img/logo.jpg',
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
    '/assets/img/Screenshot-12-light.jpg',
    '/assets/apk/FuelMaster.apk'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
    );
});
