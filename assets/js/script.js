document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');
    const languageSelect = document.getElementById('language-toggle');

    // Перевод текста
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
            "total-mileage": "0 км",
            "result": "Полный расчет: расход NaN л/100 км (трасса: 0 км, город: 0 км).",
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
            "download-apk": "Скачать APK"
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
            "total-mileage": "0 km",
            "result": "Full calculation: consumption NaN L/100 km (highway: 0 km, city: 0 km).",
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
            "download-apk": "Download APK"
        }
    };

    // Присвоение перевода элементам
    function applyTranslation(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT') {
                el.placeholder = translations[lang][key];
            } else {
                el.textContent = translations[lang][key];
            }
        });
        themeText.textContent = body.classList.contains('light') ? translations[lang].themeDark : translations[lang].themeLight;
        updateMileageAndResult();
    }

    languageSelect.addEventListener('change', () => applyTranslation(languageSelect.value));

    // Инициализация темы
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light');
    } else {
        localStorage.setItem('theme', 'dark');
    }

    toggleButton.addEventListener('click', () => {
        body.classList.toggle('light');
        localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
        themeText.textContent = body.classList.contains('light') ? translations[languageSelect.value].themeDark : translations[languageSelect.value].themeLight;
    });

    // Калькулятор топлива
    function updateMileageAndResult() {
        const start = parseFloat(document.getElementById('start-mileage').value) || 0;
        const end = parseFloat(document.getElementById('end-mileage').value) || 0;
        const fuel = parseFloat(document.getElementById('start-fuel').value) || 0;
        const highway = parseFloat(document.getElementById('highway-km').value) || 0;

        const totalEl = document.getElementById('total-mileage');
        const resultEl = document.getElementById('result');

        if (end >= start && end - start > 0) {
            const total = end - start;
            const city = total - highway;
            totalEl.textContent = `${translations[languageSelect.value].totalMileageText || translations[languageSelect.value]['total-mileage']}: ${total} км`;
            const consumption = ((fuel / total) * 100) * (city / total * 1.2 + highway / total * 0.8);
            resultEl.textContent = translations[languageSelect.value]['result'].replace('NaN', consumption.toFixed(2))
                .replace('0', highway)
                .replace('0', city);
        } else {
            totalEl.textContent = translations[languageSelect.value]['total-mileage'];
            resultEl.textContent = translations[languageSelect.value]['result'];
        }
    }

    document.getElementById('calculate-btn').addEventListener('click', updateMileageAndResult);
    ['start-mileage','end-mileage','start-fuel','highway-km'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateMileageAndResult);
    });

    applyTranslation(languageSelect.value);
});
