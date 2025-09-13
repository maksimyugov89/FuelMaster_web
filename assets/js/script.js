document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');
    const gallery = document.getElementById('screenshot-gallery');
    const weatherInfo = document.querySelector('.weather-info');
    const weatherIcon = document.querySelector('.weather-info i');

    console.log('DOM loaded, initializing...');

    // --------- ПОГОДА ---------
    function updateWeather() {
        if (!navigator.geolocation) {
            weatherInfo.innerHTML = 'Геолокация недоступна';
            return;
        }

        weatherIcon.classList.add('weather-loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`)
                    .then(response => response.json())
                    .then(data => {
                        const temp = Math.round(data.current_weather.temperature);
                        const pressureHpa = data.current_weather.pressure;
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

    // --------- ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ---------
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

    // --------- СКРИНШОТЫ ---------
    function updateScreenshots(theme) {
        const images = gallery.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const lightSrc = img.dataset.light;
            if (theme === 'light' && lightSrc) {
                img.src = lightSrc;
            } else {
                img.src = `assets/img/Screenshot-${i + 1}-dark.jpg`;
            }
        }
    }

    // --------- ЛЕНИВАЯ АНИМАЦИЯ СЕКЦИЙ ---------
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    sections.forEach(section => observer.observe(section));

    // --------- КАЛЬКУЛЯТОР ---------
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
        if (totalMileage <= 0) {
            result.textContent = 'Ошибка: общий пробег должен быть больше 0!';
            return;
        }

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

    // --------- МОДАЛЬНОЕ ОКНО ---------
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

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") closeModal();
    });

    // --------- ЛОКАЛИЗАЦИЯ ---------
    const translations = {
        ru: { /* ваш объект перевода */ },
        en: { /* ваш объект перевода */ }
    };

    function changeLanguage() {
        const lang = document.getElementById('language-toggle').value;
        for (let key in translations[lang]) {
            const el = document.getElementById(key);
            if (el) el.textContent = translations[lang][key];
        }
    }

    // --------- ОБРАТНЫЙ ОТСЧЕТ ДНЯ ---------
    function updateCountdown() {
        const endDate = new Date('2025-09-30');
        const now = new Date();
        const timeDiff = endDate - now;
        const days = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        document.getElementById('countdown').textContent = `Осталось ${days} дней!`;
    }

    // ---- ГЛОБАЛЬНЫЕ ФУНКЦИИ ----
    window.updateTotalMileage = updateTotalMileage;
    window.calculateFuel = calculateFuel;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.changeLanguage = changeLanguage;

    // --------- ИНИЦИАЛИЗАЦИЯ ---------
    updateWeather();
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    changeLanguage();
    updateCountdown();
    setInterval(updateCountdown, 86400000); // обновление раз в день
});
