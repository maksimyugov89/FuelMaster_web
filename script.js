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
                const darkSrc = img.getAttribute('src');
                img.src = darkSrc.replace('-light.jpg', '');
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

    // Калькулятор расхода
    function calculateFuel() {
        const mileage = parseFloat(document.getElementById('mileage').value);
        const fuel = parseFloat(document.getElementById('fuel').value);
        const condition = document.getElementById('condition').value;
        const result = document.getElementById('result');

        if (mileage > 0 && fuel > 0) {
            const consumption = (fuel / mileage) * 100;
            result.textContent = `Расход: ${consumption.toFixed(2)} л/100 км (${condition}).`;
        } else {
            result.textContent = 'Введите корректные данные!';
        }
    }

    // Скроллинг галереи
    function scrollGallery(direction) {
        const scrollAmount = 200;
        gallery.scrollBy({
            left: direction === 'prev' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
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
        document.getElementById('hero-title').textContent = translations[lang]["hero-title"];
        document.getElementById('hero-subtitle').textContent = translations[lang]["hero-subtitle"];
        document.getElementById('download-text').textContent = translations[lang]["download-text"];
        document.getElementById('calculator-title').textContent = translations[lang]["calculator-title"];
        document.getElementById('features-title').textContent = translations[lang]["features-title"];
        document.getElementById('feature1-title').textContent = translations[lang]["feature1-title"];
        document.getElementById('feature1-desc').textContent = translations[lang]["feature1-desc"];
        document.getElementById('feature2-title').textContent = translations[lang]["feature2-title"];
        document.getElementById('feature2-desc').textContent = translations[lang]["feature2-desc"];
        document.getElementById('feature3-title').textContent = translations[lang]["feature3-title"];
        document.getElementById('feature3-desc').textContent = translations[lang]["feature3-desc"];
        document.getElementById('feature4-title').textContent = translations[lang]["feature4-title"];
        document.getElementById('feature4-desc').textContent = translations[lang]["feature4-desc"];
        document.getElementById('screenshots-title').textContent = translations[lang]["screenshots-title"];
        document.getElementById('download-title').textContent = translations[lang]["download-title"];
        document.getElementById('download-desc').textContent = translations[lang]["download-desc"];
        document.getElementById('testimonials-title').textContent = translations[lang]["testimonials-title"];
        document.getElementById('testimonial1-text').textContent = translations[lang]["testimonial1-text"];
        document.getElementById('testimonial1-author').textContent = translations[lang]["testimonial1-author"];
        document.getElementById('testimonial2-text').textContent = translations[lang]["testimonial2-text"];
        document.getElementById('testimonial2-author').textContent = translations[lang]["testimonial2-author"];
    }

    // Инициализация
    updateWeather();
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
    changeLanguage(); // Установка языка по умолчанию (RU)
});
