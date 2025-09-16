// === FUEL MASTER - ENHANCED SCRIPT ===

class FuelMasterApp {
    constructor() {
        this.currentLang = 'ru';
        this.currentTheme = 'dark';
        this.currentImageIndex = 0;
        this.galleryImages = [];
        this.weatherCache = null;
        this.weatherCacheTime = 0;
        this.debounceTimeout = null;
        this.errorTimeout = null;
        
        // Bind methods to preserve context
        this.handleCalculatorInput = this.debounce(this.handleCalculatorInput.bind(this), 500);
        this.handleKeyboardNavigation = this.handleKeyboardNavigation.bind(this);
        this.handleImageKeydown = this.handleImageKeydown.bind(this);
        
        this.init();
    }

    // === INITIALIZATION ===
    init() {
        try {
            this.initializeElements();
            this.initializeEventListeners();
            this.loadUserPreferences();
            this.initializeAccessibility();
            this.loadWeatherData();
            this.startCountdown();
            this.initializeIntersectionObserver();
            console.log('FuelMaster app initialized successfully');
        } catch (error) {
            this.showError('Ошибка инициализации приложения');
            console.error('Init error:', error);
        }
    }

    initializeElements() {
        // Cache DOM elements
        this.elements = {
            body: document.body,
            themeToggle: document.getElementById('theme-toggle'),
            themeText: document.getElementById('theme-text'),
            languageSelect: document.getElementById('language-toggle'),
            weatherInfo: document.getElementById('weather-info'),
            galleryImages: document.querySelectorAll('#screenshot-gallery img'),
            modal: document.getElementById('modal'),
            modalImg: document.getElementById('modal-img'),
            modalCaption: document.getElementById('modal-caption'),
            calculateBtn: document.getElementById('calculate-btn'),
            inputs: {
                startMileage: document.getElementById('start-mileage'),
                endMileage: document.getElementById('end-mileage'),
                startFuel: document.getElementById('start-fuel'),
                highwayKm: document.getElementById('highway-km')
            },
            results: {
                totalMileage: document.getElementById('total-mileage'),
                result: document.getElementById('result')
            },
            loading: document.getElementById('loading'),
            errorNotification: document.getElementById('error-notification'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.querySelector('.error-close'),
            countdown: document.getElementById('countdown')
        };

        this.galleryImages = Array.from(this.elements.galleryImages);
    }

    initializeEventListeners() {
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Language change
        this.elements.languageSelect?.addEventListener('change', (e) => {
            this.currentLang = e.target.value;
            this.applyTranslation();
            this.updateGalleryImages();
            this.loadWeatherData();
        });

        // Calculator
        this.elements.calculateBtn?.addEventListener('click', () => this.calculateFuelConsumption());
        
        // Input validation and real-time calculation
        Object.values(this.elements.inputs).forEach(input => {
            if (input) {
                input.addEventListener('input', this.handleCalculatorInput);
                input.addEventListener('blur', (e) => this.validateInput(e.target));
            }
        });

        // Gallery
        this.galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => this.openModal(index));
            img.addEventListener('dblclick', () => this.openModal(index));
            img.addEventListener('keydown', this.handleImageKeydown);
        });

        // Modal
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal || e.target.classList.contains('close-modal')) {
                this.closeModal();
            }
        });

        // Carousel buttons
        document.querySelector('.carousel-btn.prev')?.addEventListener('click', () => this.prevImage());
        document.querySelector('.carousel-btn.next')?.addEventListener('click', () => this.nextImage());

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation);

        // Error notification
        this.elements.errorClose?.addEventListener('click', () => this.hideError());

        // Window resize for responsive behavior
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    initializeAccessibility() {
        // Add skip link focus handler
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Add ARIA live region for announcements
        if (!document.getElementById('aria-live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        // Add touch support detection
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }
    }

    initializeIntersectionObserver() {
        // Lazy loading and animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe sections for animations
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }

    loadUserPreferences() {
        // Load theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.currentTheme = savedTheme;
        
        if (savedTheme === 'light') {
            this.elements.body.classList.add('light');
        } else {
            this.elements.body.classList.remove('light');
        }
        
        this.elements.themeToggle?.setAttribute('aria-pressed', savedTheme === 'light');

        // Load language
        const savedLang = localStorage.getItem('language') || 'ru';
        this.currentLang = savedLang;
        if (this.elements.languageSelect) {
            this.elements.languageSelect.value = savedLang;
        }

        this.updateThemeText();
        this.updateGalleryImages();
        this.applyTranslation();
    }

    // === THEME MANAGEMENT ===
    toggleTheme() {
        try {
            this.elements.body.classList.toggle('light');
            this.currentTheme = this.elements.body.classList.contains('light') ? 'light' : 'dark';
            
            localStorage.setItem('theme', this.currentTheme);
            this.elements.themeToggle.setAttribute('aria-pressed', this.currentTheme === 'light');
            
            this.updateThemeText();
            this.updateGalleryImages();
            
            // Announce theme change to screen readers
            this.announceToScreenReader(`Тема изменена на ${this.currentTheme === 'light' ? 'светлую' : 'тёмную'}`);
            
            // Track theme change
            this.trackEvent('theme_toggle', { theme: this.currentTheme });
        } catch (error) {
            this.showError('Ошибка переключения темы');
            console.error('Theme toggle error:', error);
        }
    }

    updateThemeText() {
        if (this.elements.themeText) {
            const text = this.currentTheme === 'light' 
                ? this.translations[this.currentLang].themeDark 
                : this.translations[this.currentLang].themeLight;
            this.elements.themeText.textContent = text;
        }
    }

    updateGalleryImages() {
        this.galleryImages.forEach(img => {
            const lightSrc = img.getAttribute('data-light');
            const darkSrc = img.getAttribute('data-dark');
            
            if (lightSrc && darkSrc) {
                img.src = this.currentTheme === 'light' ? lightSrc : darkSrc;
            }
        });
    }

    // === INTERNATIONALIZATION ===
    applyTranslation() {
        try {
            const translations = this.translations[this.currentLang];
            
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[key]) {
                    if (el.tagName === 'INPUT') {
                        el.placeholder = translations[key];
                    } else {
                        el.textContent = translations[key];
                    }
                }
            });
            
            this.updateThemeText();
            this.updateCalculatorResults();
            
            // Update document language
            document.documentElement.lang = this.currentLang;
            
            // Save language preference
            localStorage.setItem('language', this.currentLang);
            
            // Track language change
            this.trackEvent('language_change', { language: this.currentLang });
        } catch (error) {
            this.showError('Ошибка применения перевода');
            console.error('Translation error:', error);
        }
    }

    // === FUEL CALCULATOR ===
    validateInput(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min) || 0;
    const errorElement = document.getElementById(`${input.id}-error`);
    
    let isValid = true;
    let errorMessage = '';

    // Проверка на пустое значение для обязательных полей
    if (input.hasAttribute('required') && !input.value.trim()) {
        isValid = false;
        errorMessage = 'Это поле обязательно для заполнения';
    }
    // Проверка на корректность числа
    else if (input.value && (isNaN(value) || value < min)) {
        isValid = false;
        errorMessage = `Введите число больше или равное ${min}`;
    }
    // Специальная проверка для конечного пробега
    else if (input.id === 'end-mileage' && input.value) {
        const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
        if (value <= startMileage) {
            isValid = false;
            errorMessage = 'Конечный пробег должен быть больше начального';
        }
    }
    // Проверка разумных пределов
    else if (input.value) {
        if (input.id.includes('mileage') && value > 999999) {
            isValid = false;
            errorMessage = 'Слишком большое значение пробега';
        }
        if (input.id === 'start-fuel' && value > 200) {
            isValid = false;
            errorMessage = 'Слишком большой объем топливного бака';
        }
    }

    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = errorMessage ? 'block' : 'none';
    }

    input.classList.toggle('error', !isValid);
    
    // Добавляем визуальную индикацию успешной валидации
    input.classList.toggle('valid', isValid && input.value);
    
    return isValid;
}

    calculateFuelConsumption() {
        try {
            this.showLoading();
            
            // Validate all inputs
            let allValid = true;
            Object.values(this.elements.inputs).forEach(input => {
                if (!this.validateInput(input)) allValid = false;
            });

            if (!allValid) {
                this.hideLoading();
                return;
            }

            const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
            const endMileage = parseFloat(this.elements.inputs.endMileage.value) || 0;
            const startFuel = parseFloat(this.elements.inputs.startFuel.value) || 0;
            const highwayKm = parseFloat(this.elements.inputs.highwayKm.value) || 0;

            if (endMileage <= startMileage || startFuel <= 0) {
                this.showError(this.translations[this.currentLang]["result-invalid"]);
                this.hideLoading();
                return;
            }

            const totalDistance = endMileage - startMileage;
            const cityKm = Math.max(0, totalDistance - highwayKm);
            
            // Enhanced calculation with different consumption factors
            const cityFactor = 1.3; // City driving uses 30% more fuel
            const highwayFactor = 0.8; // Highway driving uses 20% less fuel
            
            const adjustedDistance = (cityKm * cityFactor + highwayKm * highwayFactor);
            const consumption = (startFuel / totalDistance) * 100;
            const adjustedConsumption = adjustedDistance > 0 ? (startFuel / adjustedDistance) * 100 : consumption;

            // Update results with animation
            setTimeout(() => {
                this.updateCalculatorResults(totalDistance, consumption, adjustedConsumption, highwayKm, cityKm);
                this.hideLoading();
                
                // Announce result to screen readers
                this.announceToScreenReader(`Расчет завершен. Расход топлива: ${consumption.toFixed(2)} литров на 100 километров`);
                
                // Track calculation
                this.trackEvent('fuel_calculation', {
                    totalDistance,
                    consumption: consumption.toFixed(2),
                    cityKm,
                    highwayKm
                });
            }, 500);

        } catch (error) {
            this.hideLoading();
            this.showError('Ошибка расчета расхода топлива');
            console.error('Calculation error:', error);
        }
    }

    updateCalculatorResults(total = 0, consumption = 0, adjustedConsumption = 0, highway = 0, city = 0) {
        const lang = this.currentLang;
        const translations = this.translations[lang];
        
        if (this.elements.results.totalMileage) {
            this.elements.results.totalMileage.textContent = 
                translations["total-mileage-template"]?.replace("{total}", total) || `Общий пробег: ${total} км`;
        }
        
        if (this.elements.results.result && total > 0) {
            this.elements.results.result.textContent = 
                translations["result-template"]
                    ?.replace("{consumption}", consumption.toFixed(2))
                    ?.replace("{highway}", highway)
                    ?.replace("{city}", city) 
                || `Расход: ${consumption.toFixed(2)} л/100км (трасса: ${highway} км, город: ${city} км)`;
            
            // Add fade-in animation
            this.elements.results.result.classList.remove('fade-in');
            setTimeout(() => {
                this.elements.results.result.classList.add('fade-in');
            }, 10);
        }
    }

    handleCalculatorInput() {
        // Real-time validation and calculation preview
        let hasValidData = true;
        
        Object.values(this.elements.inputs).forEach(input => {
            if (input.value && !this.validateInput(input)) {
                hasValidData = false;
            }
        });

        if (hasValidData) {
            const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
            const endMileage = parseFloat(this.elements.inputs.endMileage.value) || 0;
            
            if (endMileage > startMileage) {
                const total = endMileage - startMileage;
                this.updateCalculatorResults(total);
            }
        }
    }

    // === WEATHER API ===
    async loadWeatherData() {
        if (!this.elements.weatherInfo) return;

        const cacheValidDuration = 10 * 60 * 1000; // 10 minutes
        const now = Date.now();

        // Check cache
        if (this.weatherCache && (now - this.weatherCacheTime) < cacheValidDuration) {
            this.displayWeather(this.weatherCache);
            return;
        }

        const translations = this.translations[this.currentLang];
        this.elements.weatherInfo.innerHTML = `
            <i class="fas fa-spinner weather-loading" aria-hidden="true"></i> 
            <span>${translations["weather-loading"] || "Загрузка..."}</span>
        `;

        if (!navigator.geolocation) {
            this.displayWeatherError();
            return;
        }

        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            // Get weather data
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`,
                { signal: AbortSignal.timeout(5000) }
            );
            
            if (!weatherResponse.ok) {
                throw new Error(`Weather API error: ${weatherResponse.status}`);
            }
            
            const weatherData = await weatherResponse.json();
            
            // Get location name
            let cityName = '—';
            try {
                const geoResponse = await fetch(
                    `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`,
                    { signal: AbortSignal.timeout(5000) }
                );
                
                if (geoResponse.ok) {
                    const geoData = await geoResponse.json();
                    cityName = geoData.address?.city || 
                              geoData.address?.town || 
                              geoData.address?.village || 
                              geoData.address?.county || '—';
                }
            } catch (geoError) {
                console.warn('Geocoding failed:', geoError);
            }

            const weatherInfo = this.processWeatherData(weatherData, cityName);
            this.weatherCache = weatherInfo;
            this.weatherCacheTime = now;
            this.displayWeather(weatherInfo);

        } catch (error) {
            console.error('Weather loading failed:', error);
            this.displayWeatherError();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                { timeout: 10000, enableHighAccuracy: false }
            );
        });
    }

    processWeatherData(data, cityName) {
        if (!data?.current_weather) {
            throw new Error('Invalid weather data');
        }

        const temp = Math.round(data.current_weather.temperature);
        const weatherCode = data.current_weather.weathercode;
        const pressure = 760; // Default value, can be enhanced with actual pressure data

        // Weather icon mapping
        let icon = '☀️';
        if (weatherCode >= 51 && weatherCode <= 67) icon = '🌧️';
        else if (weatherCode >= 71 && weatherCode <= 77) icon = '❄️';
        else if (weatherCode >= 80 && weatherCode <= 82) icon = '🌦️';
        else if (weatherCode >= 95) icon = '⛈️';
        else if (weatherCode >= 1 && weatherCode <= 3) icon = '⛅';

        return { temp, icon, city: cityName, pressure };
    }

    displayWeather(weatherInfo) {
        const translations = this.translations[this.currentLang];
        this.elements.weatherInfo.innerHTML = translations["weather-info"]
            ?.replace("{city}", weatherInfo.city)
            ?.replace("{icon}", weatherInfo.icon)
            ?.replace("{temp}", weatherInfo.temp)
            ?.replace("{pressure}", weatherInfo.pressure) ||
            `${weatherInfo.city}: ${weatherInfo.icon} ${weatherInfo.temp}°C, ${weatherInfo.pressure} мм рт.ст.`;
    }

    displayWeatherError() {
        const translations = this.translations[this.currentLang];
        this.elements.weatherInfo.innerHTML = `
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i> 
            <span>${translations["weather-error"] || "Ошибка загрузки погоды"}</span>
        `;
    }

    // === MODAL AND GALLERY ===
    openModal(index) {
        if (index < 0 || index >= this.galleryImages.length) return;
        
        this.currentImageIndex = index;
        const img = this.galleryImages[index];
        
        this.elements.modalImg.src = img.src;
        this.elements.modalImg.alt = img.alt;
        this.elements.modalCaption.textContent = img.alt;
        
        this.elements.modal.style.display = 'flex';
        this.elements.modal.setAttribute('aria-hidden', 'false');
        
        // Focus management
        const closeButton = this.elements.modal.querySelector('.close-modal');
        if (closeButton) closeButton.focus();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            this.elements.modal.classList.add('show');
        }, 10);
        
        // Track screenshot view
        this.trackEvent('screenshot_view', { image_index: index, alt: img.alt });
    }

    closeModal() {
        this.elements.modal.classList.remove('show');
        this.elements.modal.setAttribute('aria-hidden', 'true');
        
        setTimeout(() => {
            this.elements.modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Return focus to the image that opened the modal
            if (this.galleryImages[this.currentImageIndex]) {
                this.galleryImages[this.currentImageIndex].focus();
            }
        }, 300);
    }

    nextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
        this.updateModalImage();
    }

    prevImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
        this.updateModalImage();
    }

    updateModalImage() {
        const img = this.galleryImages[this.currentImageIndex];
        
        // Add transition effect
        this.elements.modalImg.style.opacity = '0';
        
        setTimeout(() => {
            this.elements.modalImg.src = img.src;
            this.elements.modalImg.alt = img.alt;
            this.elements.modalCaption.textContent = img.alt;
            this.elements.modalImg.style.opacity = '1';
        }, 150);
    }

    // === KEYBOARD NAVIGATION ===
    handleKeyboardNavigation(e) {
        // Modal navigation
        if (this.elements.modal.classList.contains('show')) {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.closeModal();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevImage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextImage();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.currentImageIndex = 0;
                    this.updateModalImage();
                    break;
                case 'End':
                    e.preventDefault();
                    this.currentImageIndex = this.galleryImages.length - 1;
                    this.updateModalImage();
                    break;
            }
        }

        // Global shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k':
                    e.preventDefault();
                    this.elements.inputs.startMileage?.focus();
                    break;
                case 'l':
                    e.preventDefault();
                    this.elements.languageSelect?.focus();
                    break;
                case 't':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
            }
        }
    }

    handleImageKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const index = this.galleryImages.indexOf(e.target);
            if (index !== -1) {
                this.openModal(index);
            }
        }
    }

    // === COUNTDOWN TIMER ===
    startCountdown() {
        if (!this.elements.countdown) return;

        const targetDate = new Date('2025-09-30T23:59:59');
        
        const updateCountdown = () => {
            const now = new Date();
            const diff = targetDate - now;
            
            if (diff <= 0) {
                this.elements.countdown.textContent = '';
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            const lang = this.currentLang;
            if (lang === 'en') {
                this.elements.countdown.textContent = `${days}d ${hours}h ${minutes}m`;
            } else {
                this.elements.countdown.textContent = `${days}д ${hours}ч ${minutes}м`;
            }
        };
        
        updateCountdown();
        setInterval(updateCountdown, 60000); // Update every minute
    }

    // === RESPONSIVE HANDLING ===
    handleResize() {
        // Close modal on resize if needed
        if (this.elements.modal.classList.contains('show')) {
            if (window.innerWidth < 768) {
                // Adjust modal for mobile
                this.elements.modal.style.padding = '10px';
            } else {
                this.elements.modal.style.padding = '20px';
            }
        }

        // Update gallery scroll
        const gallery = document.querySelector('.gallery');
        if (gallery && window.innerWidth < 768) {
            gallery.style.gap = '10px';
        }
    }

    // === UTILITY FUNCTIONS ===
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('show');
            this.elements.loading.setAttribute('aria-hidden', 'false');
        }
    }

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.remove('show');
            this.elements.loading.setAttribute('aria-hidden', 'true');
        }
    }

    showError(message) {
        if (this.elements.errorNotification && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorNotification.classList.add('show');
            this.elements.errorNotification.setAttribute('aria-hidden', 'false');
            
            // Auto-hide after 5 seconds
            if (this.errorTimeout) clearTimeout(this.errorTimeout);
            this.errorTimeout = setTimeout(() => this.hideError(), 5000);
        }
    }

    hideError() {
        if (this.elements.errorNotification) {
            this.elements.errorNotification.classList.remove('show');
            this.elements.errorNotification.setAttribute('aria-hidden', 'true');
        }
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
            this.errorTimeout = null;
        }
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    debounce(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(this.debounceTimeout);
                func(...args);
            };
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(later, wait);
        };
    }

    // Analytics tracking
    trackEvent(eventName, properties = {}) {
        console.log('Event tracked:', eventName, properties);
        // Здесь можно добавить интеграцию с Google Analytics или другими сервисами
    }

    // === TRANSLATIONS ===
    translations = {
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
            "total-mileage-template": "Общий пробег: {total} км",
            "result-template": "Расход: {consumption} л/100км (трасса: {highway} км, город: {city} км)",
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
            "weather-info": "{city}: {icon} {temp}°C, {pressure} мм рт.ст.",
            "errorInvalidNumber": "Введите корректное число",
            "errorEndMileage": "Конечный пробег должен быть больше начального", 
            "efficiency-rating": "Оценка экономичности: {rating}",
            "fuel-cost-estimate": "Примерная стоимость: {cost} руб",
            "distance-breakdown": "Расстояние: город {city} км, трасса {highway} км"
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
            "total-mileage-template": "Total distance: {total} km",
            "result-template": "Consumption: {consumption} L/100km (highway: {highway} km, city: {city} km)",
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
            "weather-info": "{city}: {icon} {temp}°C, {pressure} mmHg",
            "errorInvalidNumber": "Enter a valid number",
            "errorEndMileage": "End mileage must be greater than start mileage", 
            "efficiency-rating": "Efficiency rating: {rating}",
            "fuel-cost-estimate": "Estimated cost: {cost} RUB",
            "distance-breakdown": "Distance: city {city} km, highway {highway} km"
        }
    };
}

// === GLOBAL FUNCTIONS FOR MODAL (for backward compatibility) ===
let fuelMasterApp;

window.openModal = function(img) {
    if (fuelMasterApp && img) {
        const index = fuelMasterApp.galleryImages.indexOf(img);
        if (index !== -1) {
            fuelMasterApp.openModal(index);
        }
    }
};

window.closeModal = function() {
    if (fuelMasterApp) {
        fuelMasterApp.closeModal();
    }
};

window.nextImage = function() {
    if (fuelMasterApp) {
        fuelMasterApp.nextImage();
    }
};

window.prevImage = function() {
    if (fuelMasterApp) {
        fuelMasterApp.prevImage();
    }
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    try {
        fuelMasterApp = new FuelMasterApp();
        console.log('FuelMaster app initialized successfully');
    } catch (error) {
        console.error('Failed to initialize FuelMaster app:', error);
        
        // Fallback error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
        `;
        errorDiv.textContent = 'Ошибка загрузки приложения. Пожалуйста, обновите страницу.';
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
});

// === ERROR HANDLING ===
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (fuelMasterApp) {
        fuelMasterApp.showError('Произошла ошибка. Попробуйте обновить страницу.');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (fuelMasterApp) {
        fuelMasterApp.showError('Ошибка загрузки данных. Проверьте подключение к интернету.');
    }
});
