document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const gallery = document.getElementById('screenshot-gallery');
    const weatherInfo = document.querySelector('.weather-info');
    const weatherIcon = document.querySelector('.weather-info i');

    // Инициализация погоды
    function updateWeather() {
        if (!navigator.geolocation) {
            weatherInfo.innerHTML = 'Геолокация недоступна';
            return;
        }

        weatherIcon.classList.add('weather-loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,pressure_msl&timezone=auto`)
                    .then(response => response.json())
                    .then(data => {
                        const temp = Math.round(data.current.temperature_2m);
                        const pressureHpa = data.current.pressure_msl;
                        const pressureMm = Math.round(pressureHpa * 0.75); // Конвертация гПа в мм рт. ст.
                        
                        // Получаем город через reverse geocoding (Open-Meteo не предоставляет, используем простой fetch к Nominatim)
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
                            .then(res => res.json())
                            .then(cityData => {
                                const city = cityData.address?.city || cityData.address?.town || 'Ваш город';
                                weatherInfo.innerHTML = `<i class="fas fa-cloud"></i> ${temp}°C, ${city} <i class="fas fa-arrow-down"></i> ${pressureMm} мм`;
                            })
                            .catch(() => {
                                weatherInfo.innerHTML = `<i class="fas fa-cloud"></i> ${temp}°C <i class="fas fa-arrow-down"></i> ${pressureMm} мм`;
                            });
                        
                        weatherIcon.classList.remove('weather-loading');
                    })
                    .catch(() => {
                        weatherInfo.innerHTML = 'Ошибка загрузки погоды';
                        weatherIcon.classList.remove('weather-loading');
                    });
            },
            () => {
                weatherInfo.innerHTML = 'Геолокация заблокирована';
                weatherIcon.classList.remove('weather-loading');
            }
        );
    }

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

    // Инициализация
    updateWeather();
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
});
