document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');
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
                        const pressureMm = Math.round(pressureHpa * 0.75);
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
        themeText.textContent = 'Темная';
    } else {
        localStorage.setItem('theme', 'dark');
        themeText.textContent = 'Светлая';
    }

    // Переключение темы и скриншотов
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

    // Функция для обновления скриншотов
    function updateScreenshots(theme) {
        const images = gallery.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const lightSrc = img.getAttribute('data-light');
            if (theme === 'light' && lightSrc && i < 9) {
                img.src = lightSrc;
            } else {
                const darkSrc = `assets/img/Screenshot-${i + 1}-dark.jpg`;
                img.src = darkSrc;
            }
        }
    }

    // Ленивая анимация секций
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        observer.observe(section);
    });

    // Обновление общего километража при вводе
    function updateTotalMileage() {
        const startMileage = parseFloat(document.getElementById('start-mileage').value) || 0;
        const endMileage = parseFloat(document.getElementById('end-mileage').value) || 0;
        const totalMileageElement = document.getElementById('total-mileage');

        if (endMileage > startMileage) {
            const totalMileage = endMileage - startMileage;
            totalMileageElement.textContent = `Общий километраж: ${totalMileage} км`;
        } else if (endMileage >= 0 && startMileage >= 0) {
            totalMileageElement.textContent = 'Общий километраж: 0 км (конечный пробег должен быть больше начального)';
        } else {
            totalMileageElement.textContent = '';
        }
    }

    // Расчет расхода топлива
    function calculateFuel() {
        const startMileage = parseFloat(document.getElementById('start-mileage').value) || 0;
        const endMileage = parseFloat(document.getElementById('end-mileage').value) || 0;
        const startFuel = parseFloat(document.getElementById('start-fuel').value) || 0;
        const highwayKm = parseFloat(document.getElementById('highway-km').value) || 0;
        const result = document.getElementById('result');
        const totalMileageElement = document.getElementById('total-mileage');

        if (isNaN(startMileage) || isNaN(endMileage) || isNaN(startFuel) || isNaN(highwayKm)) {
            result.textContent = 'Ошибка: введите числовые значения!';
            return;
        }

        if (endMileage <= startMileage) {
            result.textContent = 'Ошибка: конечный пробег должен быть больше начального!';
            return;
        }

        const totalMileage = endMileage - startMileage;
        if (highwayKm < 0 || highwayKm > totalMileage) {
            result.textContent = 'Ошибка: км по трассе должны быть в пределах общего пробега!';
            return;
        }

        if (startFuel <= 0) {
            result.textContent = 'Ошибка: топливо должно быть больше 0!';
            return;
        }

        const cityKm = totalMileage - highwayKm;
        const consumption = ((startFuel / totalMileage) * 100) * (cityKm / totalMileage * 1.2 + highwayKm / totalMileage * 0.8);
        result.textContent = `Полный расчет: расход ${consumption.toFixed(2)} л/100 км (трасса: ${highwayKm} км, город: ${cityKm} км).`;
        totalMileageElement.textContent = `Общий километраж: ${totalMileage} км`;
    }

    // Модальное окно для скриншотов
    function openModal(img) {
        const modal = document.getElementById('modal');
        const modalImg = document.getElementById('modal-img');
        const modalCaption = document.getElementById('modal-caption');
        modal.style.display = 'flex';
        modalImg.src = img.src;
        modalCaption.textContent = img.alt;
    }

    function closeModal() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
    }

    // Многоязычность
    const translations = {
        ru: {
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
            "download-title": "Скачай FuelMaster",
            "download-desc": "Доступно для Android и iOS. Установи прямо сейчас!",
            "testimonials-title": "Отзывы пользователей",
            "testimonial1-text": "Отлично помогает экономить топливо!",
            "testimonial1-author": "— Иван, Москва",
            "testimonial2-text": "Простое и удобное приложение!",
            "testimonial2-author": "— Ольга, Санкт-Петербург"
        },
        en: {
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
            "download-title": "Download FuelMaster",
            "download-desc": "Available for Android and iOS. Install now!",
            "testimonials-title": "User Testimonials",
            "testimonial1-text": "Great for saving fuel!",
            "testimonial1-author": "— Ivan, Moscow",
            "testimonial2-text": "Simple and convenient app!",
            "testimonial2-author": "— Olga, Saint Petersburg"
        }
    };

    function changeLanguage() {
        const lang = document.getElementById('language-toggle').value;
        const elements = {
            'hero-title': document.getElementById('hero-title'),
            'hero-subtitle': document.getElementById('hero-subtitle'),
            'download-text': document.getElementById('download-text'),
            'calculator-title': document.getElementById('calculator-title'),
            'features-title': document.getElementById('features-title'),
            'feature1-title': document.getElementById('feature1-title'),
            'feature1-desc': document.getElementById('feature1-desc'),
            'feature2-title': document.getElementById('feature2-title'),
            'feature2-desc': document.getElementById('feature2-desc'),
            'feature3-title': document.getElementById('feature3-title'),
            'feature3-desc': document.getElementById('feature3-desc'),
            'feature4-title': document.getElementById('feature4-title'),
            'feature4-desc': document.getElementById('feature4-desc'),
            'screenshots-title': document.getElementById('screenshots-title'),
            'download-title': document.getElementById('download-title'),
            'download-desc': document.getElementById('download-desc'),
            'testimonials-title': document.getElementById('testimonials-title'),
            'testimonial1-text': document.getElementById('testimonial1-text'),
            'testimonial1-author': document.getElementById('testimonial1-author'),
            'testimonial2-text': document.getElementById('testimonial2-text'),
            'testimonial2-author': document.getElementById('testimonial2-author')
        };

        for (let key in elements) {
            if (elements[key]) {
                elements[key].textContent = translations[lang][key] || translations['ru'][key]; // Фallback на RU
            } else {
                console.warn(`Элемент с id "${key}" не найден`);
            }
        }
    }

    // Обратный отсчет для баннера
    function updateCountdown() {
        const endDate = new Date('2025-09-30');
        const now = new Date();
        const timeDiff = endDate - now;
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        document.getElementById('countdown').textContent = `Осталось ${days} дней!`;
    }

    // Инициализация
    updateWeather();
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    changeLanguage();
    updateCountdown();
    setInterval(updateCountdown, 86400000); // Обновление раз в день
});
