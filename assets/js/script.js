document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const languageSelect = document.getElementById('language-toggle');
    const themeButton = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');

    const translations = {
        ru: {
            "theme-light": "Светлая",
            "theme-dark": "Тёмная",
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
            "calculate-btn": "Рассчитать",
            "total-mileage": "Общий километраж: {total} км",
            "fuel-result": "Полный расчет: расход {consumption} л/100 км (трасса: {highway} км, город: {city} км)."
        },
        en: {
            "theme-light": "Light",
            "theme-dark": "Dark",
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
            "calculate-btn": "Calculate",
            "total-mileage": "Total Mileage: {total} km",
            "fuel-result": "Full Calculation: consumption {consumption} L/100 km (highway: {highway} km, city: {city} km)."
        }
    };

    // Перевод
    function translatePage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (!translations[lang][key]) return;

            if(el.dataset.total || el.dataset.consumption){
                let text = translations[lang][key];
                text = text.replace('{total}', el.dataset.total || 0)
                           .replace('{consumption}', el.dataset.consumption || 0)
                           .replace('{highway}', el.dataset.highway || 0)
                           .replace('{city}', el.dataset.city || 0);
                el.textContent = text;
            } else {
                if(el.tagName.toLowerCase() === 'input') el.placeholder = translations[lang][key];
                else el.textContent = translations[lang][key];
            }
        });

        themeText.textContent = body.classList.contains('light') ? translations[lang]["theme-dark"] : translations[lang]["theme-light"];

        const apkBtn = document.querySelector('#download a.btn.primary');
        const githubBtn = document.querySelector('#download a.btn.secondary');
        if(apkBtn) apkBtn.childNodes[1].textContent = ' ' + translations[lang]["download-apk"];
        if(githubBtn) githubBtn.childNodes[1].textContent = ' ' + translations[lang]["download-github"];
    }

    languageSelect.addEventListener('change', () => translatePage(languageSelect.value));

    // Калькулятор
    const startInput = document.getElementById('start-mileage');
    const endInput = document.getElementById('end-mileage');
    const fuelInput = document.getElementById('start-fuel');
    const highwayInput = document.getElementById('highway-km');
    const totalMileageEl = document.querySelector('[data-i18n="total-mileage"]');
    const fuelResultEl = document.querySelector('[data-i18n="fuel-result"]');

    function updateCalculator() {
        const start = parseFloat(startInput.value) || 0;
        const end = parseFloat(endInput.value) || 0;
        const fuel = parseFloat(fuelInput.value) || 0;
        const highway = parseFloat(highwayInput.value) || 0;

        let total = 0;
        if(end > start) total = end - start;
        totalMileageEl.dataset.total = total;

        if(end <= start) {
            fuelResultEl.dataset.consumption = 0;
            fuelResultEl.dataset.highway = 0;
            fuelResultEl.dataset.city = 0;
            fuelResultEl.textContent = languageSelect.value === 'ru' ? 'Ошибка: конечный пробег должен быть больше начального!' : 'Error: end mileage must be greater than start!';
        } else {
            const city = total - highway;
            const consumption = ((fuel / total) * 100) * (city / total * 1.2 + highway / total * 0.8);
            fuelResultEl.dataset.consumption = consumption.toFixed(2);
            fuelResultEl.dataset.highway = highway;
            fuelResultEl.dataset.city = city;
        }

        translatePage(languageSelect.value);
    }

    startInput.addEventListener('input', updateCalculator);
    endInput.addEventListener('input', updateCalculator);
    fuelInput.addEventListener('input', updateCalculator);
    highwayInput.addEventListener('input', updateCalculator);
    document.getElementById('calculate-btn').addEventListener('click', updateCalculator);

    // Тема
    if(localStorage.getItem('theme') === 'light') body.classList.add('light');
    else localStorage.setItem('theme', 'dark');

    themeButton.addEventListener('click', () => {
        body.classList.toggle('light');
        localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
        translatePage(languageSelect.value);
        updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    });

    // Скриншоты
    const gallery = document.getElementById('screenshot-gallery');
    function updateScreenshots(theme) {
        const images = gallery.getElementsByTagName('img');
        for(let i=0;i<images.length;i++){
            const img = images[i];
            const lightSrc = img.getAttribute('data-light');
            if(theme==='light' && lightSrc && i<9) img.src = lightSrc;
            else img.src = `assets/img/Screenshot-${i+1}-dark.jpg`;
        }
    }
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');

    // Модальные окна
    window.openModal = function(img){
        const modal = document.getElementById('modal');
        modal.style.display='flex';
        document.getElementById('modal-img').src = img.src;
        document.getElementById('modal-caption').textContent = img.alt;
    }
    window.closeModal = function(){
        document.getElementById('modal').style.display='none';
    }

    // Обратный отсчет баннера
    function updateCountdown() {
        const endDate = new Date('2025-09-30');
        const now = new Date();
        const diff = Math.max(Math.floor((endDate-now)/(1000*60*60*24)),0);
        document.getElementById('countdown').textContent = `Осталось ${diff} дней!`;
    }
    updateCountdown();
    setInterval(updateCountdown, 86400000);

    // Погода
    function updateWeather() {
        const weatherInfo = document.querySelector('.weather-info');
        const weatherIcon = weatherInfo.querySelector('i');
        if(!navigator.geolocation){weatherInfo.innerHTML='Геолокация недоступна'; return;}
        weatherIcon.classList.add('weather-loading');
        navigator.geolocation.getCurrentPosition(pos=>{
            const {latitude, longitude} = pos.coords;
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
                .then(r=>r.json())
                .then(data=>{
                    const temp = Math.round(data.current_weather.temperature);
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
                        .then(r=>r.json())
                        .then(cityData=>{
                            const city = cityData.address?.city || cityData.address?.town || 'Ваш город';
                            weatherInfo.innerHTML = `<i class="fas fa-cloud"></i> ${temp}°C, ${city}`;
                            weatherIcon.classList.remove('weather-loading');
                        }).catch(()=>weatherIcon.classList.remove('weather-loading'));
                }).catch(()=>{weatherInfo.innerHTML='Ошибка загрузки погоды'; weatherIcon.classList.remove('weather-loading');});
        },()=>{weatherInfo.innerHTML='Геолокация заблокирована'; weatherIcon.classList.remove('weather-loading');});
    }
    updateWeather();

    translatePage(languageSelect.value);
});
