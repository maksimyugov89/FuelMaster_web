document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const gallery = document.getElementById('screenshot-gallery');

    // Проверка сохраненной темы
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light');
    } else {
        localStorage.setItem('theme', 'dark');
    }

    // Переключение темы и скриншотов
    toggleButton.addEventListener('click', () => {
        body.classList.toggle('light');
        if (body.classList.contains('light')) {
            localStorage.setItem('theme', 'light');
            updateScreenshots('light');
        } else {
            localStorage.setItem('theme', 'dark');
            updateScreenshots('dark');
        }
    });

    // Функция для обновления скриншотов
    function updateScreenshots(theme) {
        const images = gallery.getElementsByTagName('img');
        for (let img of images) {
            const lightSrc = img.getAttribute('data-light');
            if (theme === 'light' && lightSrc) {
                img.src = lightSrc;
            } else {
                // Возвращаем исходный темный скриншот, если light-версии нет
                const darkSrc = img.getAttribute('src').replace('-light.jpg', '-dark.jpg');
                img.src = darkSrc;
            }
        }
    }

    // Инициализация скриншотов при загрузке
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
});
