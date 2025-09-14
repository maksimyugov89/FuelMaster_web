document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');
    const languageSelect = document.getElementById('language-toggle');

    const galleryImages = document.querySelectorAll('#screenshot-gallery img');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');

    const weatherInfo = document.getElementById('weather-info');

    // Переводы
    const translations = {
        ru: {
            themeLight: "Светлая",
            themeDark: "Тёмная",
            "hero-title": "Управляй расходом топлива с умом",
            "hero-subtitle": "FuelMaster — комплексное приложение для отслеживания автомобилей, расчета топлива и полезных советов.",
            "download-text": "Скачать",
            "calculator-title": "Рассчитайте расход топлива",
            "start-mileage": "Начальный пробег (км)",
            "end-mileage": "Конечный пробег (км)",
            "start-fuel": "Топливо в баке на начало (л)",
            "highway-km": "Км по трассе",
            "calculate-btn": "Рассчитать",
            "total-mileage-template": "{total} км",
            "result-template": "Полный расчет: расход {consumption} л/100 км (трасса: {highway} км, город: {city} км).",
            "result-invalid": "Введите корректные данные для расчета.",
            "seasonal-banner": "Осенние обновления 2025: Улучшенный расчет и новые советы по экономии до 30 сентября!",
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
            "download-title": "Скачай FuelMaster",
            "download-desc": "Доступно для Android и iOS. Установи прямо сейчас!",
            "download-github": "Исходный код",
            "download-apk": "Скачать APK",
            "weather-loading": "Загрузка погоды...",
            "weather-error": "Не удалось загрузить погоду",
            "weather-info": "{city}: {icon} : {temp}°C ; {pressure} мм"
        },
        en: {
            themeLight: "Light",
            themeDark: "Dark",
            "hero-title": "Manage Fuel Consumption Smartly",
            "hero-subtitle": "FuelMaster — a comprehensive app for tracking vehicles, calculating fuel, and getting useful tips.",
            "download-text": "Download",
            "calculator-title": "Calculate Fuel Consumption",
            "start-mileage": "Start Mileage (km)",
            "end-mileage": "End Mileage (km)",
            "start-fuel": "Fuel in Tank at Start (l)",
            "highway-km": "Highway km",
            "calculate-btn": "Calculate",
            "total-mileage-template": "{total} km",
            "result-template": "Full calculation: consumption {consumption} L/100 km (highway: {highway} km, city: {city} km).",
            "result-invalid": "Enter valid data for calculation.",
            "seasonal-banner": "Autumn updates 2025: Improved calculation and new saving tips until September 30!",
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
            "download-title": "Download FuelMaster",
            "download-desc": "Available for Android and iOS. Install now!",
            "download-github": "Source Code",
            "download-apk": "Download APK",
            "weather-loading": "Loading weather...",
            "weather-error": "Failed to load weather",
            "weather-info": "{city}: {icon} : {temp}°C ; {pressure} mm"
        }
    };

    function applyTranslation(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT') el.placeholder = translations[lang][key];
            else el.textContent = translations[lang][key];
        });
        themeText.textContent = body.classList.contains('light')
            ? translations[lang].themeDark
            : translations[lang].themeLight;
        updateMileageAndResult();
    }

    languageSelect.addEventListener('change', () => {
        applyTranslation(languageSelect.value);
        updateGalleryImages();
        if (weatherInfo) loadWeather();
    });

    toggleButton.addEventListener('click', () => {
        body.classList.toggle('light');
        const currentTheme = body.classList.contains('light') ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        themeText.textContent = currentTheme === 'light'
            ? translations[languageSelect.value].themeDark
            : translations[languageSelect.value].themeLight;
        applyTranslation(languageSelect.value);
        updateGalleryImages();
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') body.classList.add('light'); else body.classList.remove('light');
    themeText.textContent = savedTheme === 'light'
        ? translations[languageSelect.value].themeDark
        : translations[languageSelect.value].themeLight;
    updateGalleryImages();
    applyTranslation(languageSelect.value);

    function updateMileageAndResult() {
        const lang = languageSelect.value;
        const start = parseFloat(document.getElementById('start-mileage').value) || 0;
        const end = parseFloat(document.getElementById('end-mileage').value) || 0;
        const fuel = parseFloat(document.getElementById('start-fuel').value) || 0;
        const highway = parseFloat(document.getElementById('highway-km').value) || 0;

        const totalEl = document.getElementById('total-mileage');
        const resultEl = document.getElementById('result');

        if (end >= start && end - start > 0 && fuel > 0) {
            const total = end - start;
            const city = total - highway;
            const consumption = ((fuel / total) * 100) * (city / total * 1.2 + highway / total * 0.8);

            totalEl.textContent = translations[lang]["total-mileage-template"].replace("{total}", total);
            resultEl.textContent = translations[lang]["result-template"]
                .replace("{consumption}", consumption.toFixed(2))
                .replace("{highway}", highway)
                .replace("{city}", city);
        } else {
            totalEl.textContent = translations[lang]["total-mileage-template"].replace("{total}", 0);
            resultEl.textContent = translations[lang]["result-invalid"];
        }
    }

    document.getElementById('calculate-btn').addEventListener('click', updateMileageAndResult);
    ['start-mileage','end-mileage','start-fuel','highway-km'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateMileageAndResult);
    });

    function updateGalleryImages() {
        const theme = body.classList.contains('light') ? 'light' : 'dark';
        galleryImages.forEach(img => {
            const lightSrc = img.getAttribute('data-light');
            if (lightSrc) img.src = theme === 'light' ? lightSrc : lightSrc.replace('-light', '-dark');
        });
    }

    // === Изменение: автоматическое определение города по координатам и сокращение мм рт.ст. ===
    async function loadWeather() {
        if (!weatherInfo) return;
        const lang = languageSelect.value;
        weatherInfo.textContent = translations[lang]["weather-loading"];

        if (!navigator.geolocation) {
            weatherInfo.textContent = translations[lang]["weather-error"];
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                const data = await res.json();
                if (data && data.current_weather) {
                    const temp = data.current_weather.temperature;
                    const weatherCode = data.current_weather.weathercode;
                    const pressure = 760; // можно уточнить по API
                    let icon = '☀️';
                    if (weatherCode >= 51 && weatherCode <= 67) icon = '🌧️';
                    else if (weatherCode >= 71 && weatherCode <= 77) icon = '❄️';
                    else if (weatherCode >= 80 && weatherCode <= 82) icon = '🌦️';
                    else if (weatherCode >= 95) icon = '⛈️';

                    // Обратное геокодирование
                    const geoRes = await fetch(`https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`);
                    const geoData = await geoRes.json();
                    const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || '—';

                    weatherInfo.textContent = translations[lang]["weather-info"]
                        .replace("{city}", city)
                        .replace("{icon}", icon)
                        .replace("{temp}", temp)
                        .replace("{pressure}", pressure);
                } else weatherInfo.textContent = translations[lang]["weather-error"];
            } catch {
                weatherInfo.textContent = translations[lang]["weather-error"];
            }
        }, () => {
            weatherInfo.textContent = translations[lang]["weather-error"];
        });
    }
    // === Конец изменения ===

    loadWeather();

    let currentIndex = 0;

    // ==== Исправленные функции модалки ====
    window.openModal = function(img) {
        currentIndex = [...galleryImages].indexOf(img);
        modalImg.src = img.src;
        modalCaption.textContent = img.alt;
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10); // плавное появление
    };

    window.closeModal = function() {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300); // ждём завершения анимации
    };

    window.nextImage = function() {
        currentIndex = (currentIndex + 1) % galleryImages.length;
        modalImg.src = galleryImages[currentIndex].src;
        modalCaption.textContent = galleryImages[currentIndex].alt;
    };

    window.prevImage = function() {
        currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
        modalImg.src = galleryImages[currentIndex].src;
        modalCaption.textContent = galleryImages[currentIndex].alt;
    };

    // Добавляем событие двойного клика для открытия модалки
    galleryImages.forEach(img => {
        img.addEventListener('dblclick', () => openModal(img));
    });

    // Закрытие модалки по клику на фон
    modal.addEventListener('click', e => {
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            closeModal();
        }
    });
});
