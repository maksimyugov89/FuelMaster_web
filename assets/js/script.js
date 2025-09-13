document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');
    const gallery = document.getElementById('screenshot-gallery');
    const weatherInfo = document.querySelector('.weather-info');
    const weatherIcon = document.querySelector('.weather-info i');

    // --- Многоязычность ---
    const translations = {
        ru: {
            "hero-title":"Управляй расходом топлива с умом",
            "hero-subtitle":"FuelMaster — комплексное приложение для отслеживания автомобилей, расчета топлива и полезных советов.",
            "download-text":"Скачать",
            "calculator-title":"Рассчитайте расход топлива",
            "start-mileage":"Начальный пробег (км)",
            "end-mileage":"Конечный пробег (км)",
            "start-fuel":"Топливо в баке на начало (л)",
            "highway-km":"Км по трассе",
            "calculate-btn":"Рассчитать",
            "features-title":"Основные возможности",
            "feature1-title":"Управление авто",
            "feature1-desc":"Добавление, редактирование, удаление автомобилей с базой моделей из CSV.",
            "feature2-title":"Расчет расхода",
            "feature2-desc":"Учет города/трассы, погоды, кондиционера и других факторов.",
            "feature3-title":"История и графики",
            "feature3-desc":"Хранение, фильтры и визуализация с fl_chart.",
            "feature4-title":"Безопасность и премиум",
            "feature4-desc":"Firebase вход, синхронизация с Firestore для премиум.",
            "screenshots-title":"Скриншоты",
            "download-title":"Скачай FuelMaster",
            "download-desc":"Доступно для Android и iOS. Установи прямо сейчас!",
            "testimonial1-text":"Отлично помогает экономить топливо!",
            "testimonial1-author":"— Иван, Москва",
            "testimonial2-text":"Простое и удобное приложение!",
            "testimonial2-author":"— Ольга, Санкт-Петербург"
        },
        en: {
            "hero-title":"Manage Fuel Consumption Smartly",
            "hero-subtitle":"FuelMaster — a comprehensive app for tracking vehicles, calculating fuel, and getting useful tips.",
            "download-text":"Download",
            "calculator-title":"Calculate Fuel Consumption",
            "start-mileage":"Start mileage (km)",
            "end-mileage":"End mileage (km)",
            "start-fuel":"Fuel at start (l)",
            "highway-km":"Highway km",
            "calculate-btn":"Calculate",
            "features-title":"Key Features",
            "feature1-title":"Vehicle Management",
            "feature1-desc":"Add, edit, and delete vehicles with a CSV model database.",
            "feature2-title":"Fuel Calculation",
            "feature2-desc":"Accounts for city/highway, weather, AC, and other factors.",
            "feature3-title":"History & Charts",
            "feature3-desc":"Storage, filters, and visualization with fl_chart.",
            "feature4-title":"Security & Premium",
            "feature4-desc":"Firebase login, Firestore sync for premium users.",
            "screenshots-title":"Screenshots",
            "download-title":"Download FuelMaster",
            "download-desc":"Available for Android and iOS. Install now!",
            "testimonial1-text":"Great for saving fuel!",
            "testimonial1-author":"— Ivan, Moscow",
            "testimonial2-text":"Simple and convenient app!",
            "testimonial2-author":"— Olga, Saint Petersburg"
        }
    };

    function changeLanguage() {
        const lang = document.getElementById('language-toggle').value || 'ru';
        Object.keys(translations[lang]).forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                if(el.tagName.toLowerCase() === 'input') {
                    el.placeholder = translations[lang][id];
                } else {
                    el.textContent = translations[lang][id];
                }
            }
        });
    }

    document.getElementById('language-toggle').addEventListener('change', changeLanguage);
    changeLanguage();

    // --- Тема (светлая/тёмная) ---
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light');
        themeText.textContent = 'Темная';
    } else {
        localStorage.setItem('theme', 'dark');
        themeText.textContent = 'Светлая';
    }

    toggleButton.addEventListener('click', () => {
        body.classList.toggle('light');
        if (body.classList.contains('light')) {
            localStorage.setItem('theme', 'light');
            themeText.textContent = 'Темная';
            updateScreenshots('light');
        } else {
            localStorage.setItem('theme', 'dark');
            themeText.textContent = 'Светлая';
            updateScreenshots('dark');
        }
    });

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

    // --- Погода ---
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
                    .then(res => res.json())
                    .then(data => {
                        const temp = Math.round(data.current_weather.temperature);
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
                            .then(r => r.json())
                            .then(cityData => {
                                const city = cityData.address?.city || cityData.address?.town || 'Ваш город';
                                weatherInfo.innerHTML = `<i class="fas fa-cloud"></i> ${temp}°C, ${city}`;
                            })
                            .catch(() => { weatherInfo.innerHTML = `<i class="fas fa-cloud"></i> ${temp}°C`; });
                        weatherIcon.classList.remove('weather-loading');
                    })
                    .catch(() => { weatherInfo.innerHTML = 'Ошибка загрузки погоды'; weatherIcon.classList.remove('weather-loading'); });
            },
            () => { weatherInfo.innerHTML = 'Геолокация заблокирована'; weatherIcon.classList.remove('weather-loading'); }
        );
    }

    // --- Калькулятор ---
    function updateTotalMileage() {
        const startMileage = parseFloat(document.getElementById('start-mileage').value) || 0;
        const endMileage = parseFloat(document.getElementById('end-mileage').value) || 0;
        const totalMileageElement = document.getElementById('total-mileage');
        if (endMileage > startMileage) {
            totalMileageElement.textContent = `Общий километраж: ${endMileage - startMileage} км`;
        } else if (endMileage >= 0 && startMileage >= 0) {
            totalMileageElement.textContent = 'Общий километраж: 0 км (конечный пробег должен быть больше начального)';
        } else totalMileageElement.textContent = '';
    }

    function calculateFuel() {
        const startMileage = parseFloat(document.getElementById('start-mileage').value) || 0;
        const endMileage = parseFloat(document.getElementById('end-mileage').value) || 0;
        const startFuel = parseFloat(document.getElementById('start-fuel').value) || 0;
        const highwayKm = parseFloat(document.getElementById('highway-km').value) || 0;
        const result = document.getElementById('result');
        const totalMileageElement = document.getElementById('total-mileage');

        if (endMileage <= startMileage) {
            result.textContent = 'Ошибка: конечный пробег должен быть больше начального!';
            return;
        }

        const totalMileage = endMileage - startMileage;
        const cityKm = totalMileage - highwayKm;
        const consumption = ((startFuel / totalMileage) * 100) * (cityKm / totalMileage * 1.2 + highwayKm / totalMileage * 0.8);
        result.textContent = `Полный расчет: расход ${consumption.toFixed(2)} л/100 км (трасса: ${highwayKm} км, город: ${cityKm} км).`;
        totalMileageElement.textContent = `Общий километраж: ${totalMileage} км`;
    }

    document.getElementById('start-mileage').addEventListener('input', updateTotalMileage);
    document.getElementById('end-mileage').addEventListener('input', updateTotalMileage);
    document.getElementById('calculate-btn').addEventListener('click', calculateFuel);

    // --- Модальное окно ---
    function openModal(img) {
        const modal = document.getElementById('modal');
        const modalImg = document.getElementById('modal-img');
        const modalCaption = document.getElementById('modal-caption');
        modal.style.display = 'flex';
        modalImg.src = img.src;
        modalCaption.textContent = img.alt;
    }

    function closeModal() { document.getElementById('modal').style.display = 'none'; }

    window.openModal = openModal;
    window.closeModal = closeModal;

    // --- Ленивая анимация ---
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('fade-in'); });
    }, { threshold: 0.1 });
    sections.forEach(section => observer.observe(section));

    // --- Баннер обратного отсчета ---
    function updateCountdown() {
        const endDate = new Date('2025-09-30');
        const now = new Date();
        const days = Math.max(Math.floor((endDate - now) / (1000 * 60 * 60 * 24)), 0);
        document.getElementById('countdown').textContent = `Осталось ${days} дней!`;
    }

    // --- Инициализация ---
    updateWeather();
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    updateCountdown();
    setInterval(updateCountdown, 86400000); // Обновление раз в день
});
