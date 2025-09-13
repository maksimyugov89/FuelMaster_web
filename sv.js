self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('fuelmaster-v1').then((cache) => {
            return cache.addAll([
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
                '/assets/img/Screenshot-9-light.jpg'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
