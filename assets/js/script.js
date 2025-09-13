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
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`)
                    .then(response => response.json())
                    .then(data => {
                        const temp = Math.round(data.current_weather.temperature);
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
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

    // Темная/светлая тема
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
            if (theme === 'light' && lightSrc) {
                img.src = lightSrc;
            } else {
                const darkSrc = `assets/img/Screenshot-${i + 1}-dark.jpg`;
                img.src = darkSrc;
            }
        }
    }

    // Калькулятор
    const startMileageInput = document.getElementById('start-mileage');
    const endMileageInput = document.getElementById('end-mileage');
    const startFuelInput = document.getElementById('start-fuel');
    const highwayKmInput = document.getElementById('highway-km');
    const totalMileageEl = document.getElementById('total-mileage');
    const resultEl = document.getElementById('result');
    const calculateBtn = document.getElementById('calculate-btn');

    function updateTotalMileage() {
        const start = parseFloat(startMileageInput.value) || 0;
        const end = parseFloat(endMileageInput.value) || 0;
        if (end > start) {
            totalMileageEl.textContent = `Общий километраж: ${end - start} км`;
        } else {
            totalMileageEl.textContent = 'Общий километраж: 0 км (конечный пробег должен быть больше начального)';
        }
    }

    function calculateFuel() {
        const start = parseFloat(startMileageInput.value) || 0;
        const end = parseFloat(endMileageInput.value) || 0;
        const fuel = parseFloat(startFuelInput.value) || 0;
        const highway = parseFloat(highwayKmInput.value) || 0;

        if (end <= start) {
            resultEl.textContent = 'Ошибка: конечный пробег должен быть больше начального!';
            return;
        }

        const totalKm = end - start;
        const cityKm = totalKm - highway;
        const consumption = (fuel / totalKm) * 100 * (cityKm / totalKm * 1.2 + highway / totalKm * 0.8);

        totalMileageEl.textContent = `Общий километраж: ${totalKm} км`;
        resultEl.textContent = `Полный расчет: расход ${consumption.toFixed(2)} л/100 км (город: ${cityKm} км, трасса: ${highway} км)`;
    }

    startMileageInput.addEventListener('input', updateTotalMileage);
    endMileageInput.addEventListener('input', updateTotalMileage);
    calculateBtn.addEventListener('click', calculateFuel);

    // Модальные окна для скриншотов
    window.openModal = function(img) {
        const modal = document.getElementById('modal');
        const modalImg = document.getElementById('modal-img');
        const modalCaption = document.getElementById('modal-caption');
        modal.style.display = 'flex';
        modalImg.src = img.src;
        modalCaption.textContent = img.alt;
    };

    window.closeModal = function() {
        document.getElementById('modal').style.display = 'none';
    };

    // Многоязычность
    const translations = { /* оставляем как в оригинале */ };
    window.changeLanguage = function() { /* оставляем как в оригинале */ };

    // Баннер обратного отсчета
    function updateCountdown() {
        const endDate = new Date('2025-09-30');
        const now = new Date();
        const days = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
        document.getElementById('countdown').textContent = `Осталось ${days} дней!`;
    }

    // Ленивая анимация секций
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('fade-in');
        });
    }, { threshold: 0.1 });
    sections.forEach(section => observer.observe(section));

    // Инициализация
    updateWeather();
    updateScreenshots(body.classList.contains('light') ? 'light' : 'dark');
    changeLanguage();
    updateCountdown();
    setInterval(updateCountdown, 86400000);
});
