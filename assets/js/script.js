document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');
    const gallery = document.getElementById('screenshot-gallery');
    const weatherInfo = document.querySelector('.weather-info');
    const weatherIcon = document.querySelector('.weather-info i');
    const totalMileageElement = document.getElementById('total-mileage');
    const resultElement = document.getElementById('result');

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
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
                    .then(response => response.json())
                    .then(data => {
                        const temp = Math.round(data.current_weather.temperature);
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
                            .then(res => res.json())
                            .then(cityData => {
                                const city = cityData.address?.city || cityData.address?.town || 'Ваш город';
                                weatherInfo.innerHTML = `<i class="fas fa-cloud"></i> ${temp}°C, ${city}`;
                            })
                            .catch(() => {
                                weatherInfo.innerHTML = `<i class="fas fa-cloud"></i> ${temp}°C`;
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
        themeText.textContent = ''; // будем переводить ниже
    } else {
        localStorage.setItem('theme', 'dark');
        themeText.textContent = '';
    }

    // Переключение темы
    toggleButton.addEventListener('click', () => {
        body.classList.toggle('light');
        if (body.classList.contains('light')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
        updateLanguageTexts(); // обновляем текст темы
        updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    });

    // Скриншоты
    function updateScreenshots(theme) {
        const images = gallery.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const lightSrc = img.getAttribute('data-light');
            if (theme === 'light' && lightSrc && i < 9) {
                img.src = lightSrc;
            } else {
                img.src = `assets/img/Screenshot-${i + 1}-dark.jpg`;
            }
        }
    }

    // Калькулятор
    function updateTotalMileage() {
        const startMileage = parseFloat(document.getElementById('start-mileage').value) || 0;
        const endMileage = parseFloat(document.getElementById('end-mileage').value) || 0;
        if (endMileage > startMileage) {
            const total = endMileage - startMileage;
            totalMileageElement.dataset.mileage = total; // сохраняем число для перевода
        } else {
            totalMileageElement.dataset.mileage = 0;
        }
        updateLanguageTexts();
    }

    function calculateFuel() {
        const startMileage = parseFloat(document.getElementById('start-mileage').value) || 0;
        const endMileage = parseFloat(document.getElementById('end-mileage').value) || 0;
        const startFuel = parseFloat(document.getElementById('start-fuel').value) || 0;
        const highwayKm = parseFloat(document.getElementById('highway-km').value) || 0;

        if (endMileage <= startMileage) {
            resultElement.dataset.text = 'error';
        } else {
            const totalMileage = endMileage - startMileage;
            const cityKm = totalMileage - highwayKm;
            const consumption = ((startFuel / totalMileage) * 100) * (cityKm / totalMileage * 1.2 + highwayKm / totalMileage * 0.8);
            resultElement.dataset.text = JSON.stringify({
                total: totalMileage,
                consumption: consumption.toFixed(2),
                highway: highwayKm,
                city: cityKm
            });
        }
        updateLanguageTexts();
    }

    document.getElementById('start-mileage').addEventListener('input', updateTotalMileage);
    document.getElementById('end-mileage').addEventListener('input', updateTotalMileage);
    document.getElementById('calculate-btn').addEventListener('click', calculateFuel);

    // Модальное окно
    function openModal(img) {
        const modal = document.getElementById('modal');
        const modalImg = document.getElementById('modal-img');
        const modalCaption = document.getElementById('modal-caption');
        modal.style.display = 'flex';
        modalImg.src = img.src;
        modalCaption.textContent = img.alt;
    }
    function closeModal() {
        document.getElementById('modal').style.display = 'none';
    }
    window.openModal = openModal;
    window.closeModal = closeModal;

    // Переводы
    const translations = {
        ru: {
            "theme-light": "Светлая",
            "theme-dark": "Тёмная",
            "total-mileage": "Общий километраж: {total} км",
            "fuel-result": "Полный расчет: расход {consumption} л/100 км (трасса: {highway} км, город: {city} км).",
            "hero-title": "Управляй расходом топлива с умом",
            "hero-subtitle": "FuelMaster — комплексное приложение для отслеживания автомобилей, расчета топлива и полезных советов.",
            "download-text": "Скачать",
            "calculator-title": "Рассчитайте расход топлива",
            "features-title": "Основные возможности",
            "feature1-title": "Управление авто",
            "feature1-desc": "Добавление, редактирование, удаление автомобилей с базой моделей из CSV.",
            "feature2-title": "Расчет расхода",
            "feature2-desc": "Учет города/трассы, погоды, кондиционера и других факторов.",
            "feature3-title": "История и графики",
            "feature3-desc": "Хранение, фильтры и визуализация с fl_chart.",
            "feature4-title": "Безопасность и премиум",
            "feature4-desc": "Firebase вход, синхронизация с Firestore для премиум.",
            "screenshots-title": "Скриншоты",
            "testimonials-title": "Отзывы пользователей",
            "testimonial1-text": "Отлично помогает экономить топливо!",
            "testimonial1-author": "— Иван, Москва",
            "testimonial2-text": "Простое и удобное приложение!",
            "testimonial2-author": "— Ольга, Санкт-Петербург",
            "download-apk": "Скачать APK",
            "download-github": "Исходный код",
            "start-mileage": "Начальный пробег (км)",
            "end-mileage": "Конечный пробег (км)",
            "start-fuel": "Топливо в баке на начало (л)",
            "highway-km": "Км по трассе",
            "calculate-btn": "Рассчитать"
        },
        en: {
            "theme-light": "Light",
            "theme-dark": "Dark",
            "total-mileage": "Total Mileage: {total} km",
            "fuel-result": "Full Calculation: consumption {consumption} L/100 km (highway: {highway} km, city: {city} km).",
            "hero-title": "Manage Fuel Consumption Smartly",
            "hero-subtitle": "FuelMaster — a comprehensive app for tracking vehicles, calculating fuel, and getting useful tips.",
            "download-text": "Download",
            "calculator-title": "Calculate Fuel Consumption",
            "features-title": "Key Features",
            "feature1-title": "Vehicle Management",
            "feature1-desc": "Add, edit, and delete vehicles with a CSV model database.",
            "feature2-title": "Fuel Calculation",
            "feature2-desc": "Accounts for city/highway, weather, AC, and other factors.",
            "feature3-title": "History & Charts",
            "feature3-desc": "Storage, filters, and visualization with fl_chart.",
            "feature4-title": "Security & Premium",
            "feature4-desc": "Firebase login, Firestore sync for premium users.",
            "screenshots-title": "Screenshots",
            "testimonials-title": "User Testimonials",
            "testimonial1-text": "Great for saving fuel!",
            "testimonial1-author": "— Ivan, Moscow",
            "testimonial2-text": "Simple and convenient app!",
            "testimonial2-author": "— Olga, Saint Petersburg",
            "download-apk": "Download APK",
            "download-github": "Source Code",
            "start-mileage": "Start Mileage (km)",
            "end-mileage": "End Mileage (km)",
            "start-fuel": "Fuel in Tank at Start (L)",
            "highway-km": "Highway Km",
            "calculate-btn": "Calculate"
        }
    };

    function updateLanguageTexts() {
        const lang = document.getElementById('language-toggle').value || 'ru';

        // Тема
        themeText.textContent = body.classList.contains('light') ? translations[lang]["theme-dark"] : translations[lang]["theme-light"];

        // Калькулятор результат
        if(resultElement.dataset.text) {
            if(resultElement.dataset.text === 'error') {
                resultElement.textContent = lang === 'ru' ? 'Ошибка: конечный пробег должен быть больше начального!' : 'Error: end mileage must be greater than start!';
            } else {
                const data = JSON.parse(resultElement.dataset.text);
                resultElement.textContent = translations[lang]["fuel-result"]
                    .replace('{consumption}', data.consumption)
                    .replace('{highway}', data.highway)
                    .replace('{city}', data.city);
            }
        }

        // Общий километраж
        if(totalMileageElement.dataset.mileage) {
            totalMileageElement.textContent = translations[lang]["total-mileage"].replace('{total}', totalMileageElement.dataset.mileage);
        }

        // Все элементы с id
        document.querySelectorAll('[id]').forEach(el => {
            const key = el.id;
            if(translations[lang][key]) {
                if(el.tagName.toLowerCase() === 'input') {
                    el.placeholder = translations[lang][key];
                } else if(el.tagName.toLowerCase() === 'button') {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });

        // Кнопки скачивания с <img>
        const apkBtn = document.querySelector('#download a.btn.primary');
        const githubBtn = document.querySelector('#download a.btn.secondary');
        if(apkBtn) apkBtn.childNodes[1].textContent = ' ' + translations[lang]["download-apk"];
        if(githubBtn) githubBtn.childNodes[1].textContent = ' ' + translations[lang]["download-github"];
    }

    function changeLanguage() {
        updateLanguageTexts();
    }

    document.getElementById('language-toggle').addEventListener('change', changeLanguage);

    // Баннер обратного отсчета
    function updateCountdown() {
        const endDate = new Date('2025-09-30');
        const now = new Date();
        const timeDiff = endDate - now;
        const days = Math.max(Math.floor(timeDiff / (1000 * 60 * 60 * 24)), 0);
        document.getElementById('countdown').textContent = `Осталось ${days} дней!`;
    }

    // Инициализация
    updateWeather();
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    updateLanguageTexts();
    updateCountdown();
    setInterval(updateCountdown, 86400000);
});
