// === FUEL MASTER - ENHANCED SCRIPT V2.0 ===

// === MODAL MANAGER CLASS ===
class ModalManager {
    constructor() {
        this.modal = document.getElementById('modal');
        this.modalImg = document.getElementById('modal-img');
        this.modalCaption = document.getElementById('modal-caption');
        this.closeBtn = this.modal?.querySelector('.close-modal');
        this.prevBtn = this.modal?.querySelector('.carousel-btn.prev');
        this.nextBtn = this.modal?.querySelector('.carousel-btn.next');
        this.backdrop = this.modal?.querySelector('.modal-backdrop');
        
        this.currentImageIndex = 0;
        this.galleryImages = [];
        this.isOpen = false;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        if (!this.modal) return;
        
        // Кнопка закрытия
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeModal();
            });
        }
        
        // Клик по backdrop
        if (this.backdrop) {
            this.backdrop.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeModal();
            });
        }
        
        // Клик вне модального контента
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Предотвращаем всплытие событий от содержимого модалки
        const modalContent = this.modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Кнопки навигации
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevImage();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextImage();
            });
        }
        
        // Клавиатурные события
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
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
                    this.goToImage(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToImage(this.galleryImages.length - 1);
                    break;
            }
        });
        
        // Предотвращаем прокрутку страницы стрелками когда модалка открыта
        document.addEventListener('keydown', (e) => {
            if (this.isOpen && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    setGalleryImages(images) {
        this.galleryImages = Array.from(images);
        
        // Добавляем обработчики кликов на изображения галереи
        this.galleryImages.forEach((img, index) => {
            // Удаляем старые обработчики если есть
            const newImg = img.cloneNode(true);
            img.parentNode.replaceChild(newImg, img);
            this.galleryImages[index] = newImg;
            
            newImg.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal(index);
            });
            
            newImg.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openModal(index);
                }
            });
        });
    }
    
    openModal(index) {
        if (index < 0 || index >= this.galleryImages.length) return;
        
        this.currentImageIndex = index;
        this.isOpen = true;
        
        // Обновляем изображение
        this.updateModalImage();
        
        // Показываем/скрываем кнопки навигации
        this.updateNavigationButtons();
        
        // Показываем модальное окно
        this.modal.style.display = 'flex';
        this.modal.setAttribute('aria-hidden', 'false');
        
        // Блокируем прокрутку страницы
        document.body.style.overflow = 'hidden';
        
        // Добавляем класс с анимацией
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
        
        // Фокус на кнопке закрытия
        setTimeout(() => {
            if (this.closeBtn) {
                this.closeBtn.focus();
            }
        }, 100);
        
        // Аналитика
        if (window.fuelMasterApp) {
            window.fuelMasterApp.trackEvent('screenshot_view', { 
                image_index: index, 
                alt: this.galleryImages[index]?.alt || 'Screenshot'
            });
        }
    }
    
    closeModal() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.modal.classList.remove('show');
        this.modal.setAttribute('aria-hidden', 'true');
        
        // Возвращаем фокус на изображение, которое открыло модалку
        const originalImage = this.galleryImages[this.currentImageIndex];
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Возвращаем фокус
            if (originalImage && originalImage.focus) {
                originalImage.focus();
            }
        }, 300);
    }
    
    nextImage() {
        if (!this.isOpen || this.galleryImages.length <= 1) return;
        
        this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
        this.updateModalImage();
    }
    
    prevImage() {
        if (!this.isOpen || this.galleryImages.length <= 1) return;
        
        this.currentImageIndex = (this.currentImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
        this.updateModalImage();
    }
    
    goToImage(index) {
        if (index < 0 || index >= this.galleryImages.length || !this.isOpen) return;
        
        this.currentImageIndex = index;
        this.updateModalImage();
    }
    
    updateModalImage() {
        if (!this.modalImg || !this.galleryImages[this.currentImageIndex]) return;
        
        const img = this.galleryImages[this.currentImageIndex];
        
        // Плавное обновление изображения
        this.modalImg.style.opacity = '0';
        this.modalImg.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            this.modalImg.src = img.src;
            this.modalImg.alt = img.alt || 'Screenshot';
            
            if (this.modalCaption) {
                this.modalCaption.textContent = img.alt || `Скриншот ${this.currentImageIndex + 1} из ${this.galleryImages.length}`;
            }
            
            this.modalImg.style.opacity = '1';
            this.modalImg.style.transform = 'scale(1)';
        }, 150);
        
        this.updateNavigationButtons();
    }
    
    updateNavigationButtons() {
        const hasMultipleImages = this.galleryImages.length > 1;
        
        if (this.prevBtn) {
            this.prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        }
        
        if (this.nextBtn) {
            this.nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        }
        
        // Обновляем атрибут модального окна
        if (hasMultipleImages) {
            this.modal.removeAttribute('data-single-image');
        } else {
            this.modal.setAttribute('data-single-image', 'true');
        }
    }
}

// === MAIN FUEL MASTER APP CLASS ===
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
        this.calculationHistory = [];
        this.modalManager = null;
        
        // Bind methods to preserve context
        this.handleCalculatorInput = this.debounce(this.handleCalculatorInput.bind(this), 300);
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
            this.loadCalculationHistory();
            console.log('FuelMaster app initialized successfully v2.0');
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
                highwayKm: document.getElementById('highway-km'),
                fuelPrice: document.getElementById('fuel-price')
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
        
        // Инициализация модального менеджера
        this.modalManager = new ModalManager();
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
                input.addEventListener('focus', (e) => this.handleInputFocus(e.target));
            }
        });

        // Gallery - используем модальный менеджер
        if (this.modalManager) {
            this.modalManager.setGalleryImages(this.galleryImages);
        }

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation);

        // Error notification
        this.elements.errorClose?.addEventListener('click', () => this.hideError());

        // Window resize for responsive behavior
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Page visibility for pause/resume
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
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
            liveRegion.style.cssText = `
                position: absolute; left: -10000px; width: 1px; 
                height: 1px; overflow: hidden;
            `;
            document.body.appendChild(liveRegion);
        }

        // Touch support detection
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }

        // Reduced motion support
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }

    initializeIntersectionObserver() {
        if (!window.IntersectionObserver) return;

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
        try {
            // Load theme
            const savedTheme = localStorage.getItem('fuelmaster-theme') || 'dark';
            this.currentTheme = savedTheme;
            
            if (savedTheme === 'light') {
                this.elements.body.classList.add('light');
            } else {
                this.elements.body.classList.remove('light');
            }
            
            this.elements.themeToggle?.setAttribute('aria-pressed', savedTheme === 'light');

            // Load language
            const savedLang = localStorage.getItem('fuelmaster-language') || 'ru';
            this.currentLang = savedLang;
            if (this.elements.languageSelect) {
                this.elements.languageSelect.value = savedLang;
            }

            this.updateThemeText();
            this.updateGalleryImages();
            this.applyTranslation();
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }
    }

    loadCalculationHistory() {
        try {
            const history = localStorage.getItem('fuelmaster-history');
            this.calculationHistory = history ? JSON.parse(history) : [];
        } catch (error) {
            console.warn('Failed to load calculation history:', error);
            this.calculationHistory = [];
        }
    }

    saveCalculationHistory(calculation) {
        try {
            this.calculationHistory.unshift({
                ...calculation,
                timestamp: Date.now(),
                id: Date.now() + Math.random()
            });
            
            // Keep only last 50 calculations
            this.calculationHistory = this.calculationHistory.slice(0, 50);
            
            localStorage.setItem('fuelmaster-history', JSON.stringify(this.calculationHistory));
        } catch (error) {
            console.warn('Failed to save calculation history:', error);
        }
    }

    // === THEME MANAGEMENT ===
    toggleTheme() {
        try {
            this.elements.body.classList.toggle('light');
            this.currentTheme = this.elements.body.classList.contains('light') ? 'light' : 'dark';
            
            localStorage.setItem('fuelmaster-theme', this.currentTheme);
            this.elements.themeToggle.setAttribute('aria-pressed', this.currentTheme === 'light');
            
            this.updateThemeText();
            this.updateGalleryImages();
            
            // Announce theme change to screen readers
            this.announceToScreenReader(
                `Тема изменена на ${this.currentTheme === 'light' ? 'светлую' : 'тёмную'}`
            );
            
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
                const newSrc = this.currentTheme === 'light' ? lightSrc : darkSrc;
                if (img.src !== newSrc) {
                    img.src = newSrc;
                }
            }
        });
    }

    // === INTERNATIONALIZATION ===
    applyTranslation() {
        try {
            const translations = this.translations[this.currentLang];
            if (!translations) return;
            
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
            
            // Update document language
            document.documentElement.lang = this.currentLang;
            
            // Save language preference
            localStorage.setItem('fuelmaster-language', this.currentLang);
            
            // Track language change
            this.trackEvent('language_change', { language: this.currentLang });
        } catch (error) {
            this.showError('Ошибка применения перевода');
            console.error('Translation error:', error);
        }
    }

    // === FUEL CALCULATOR - ENHANCED ===
    validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        const errorElement = document.getElementById(`${input.id}-error`);
        
        let isValid = true;
        let errorMessage = '';

        // Check for required fields
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            errorMessage = this.translations[this.currentLang].errorRequired || 'Это поле обязательно';
        }
        // Check for valid number
        else if (input.value && (isNaN(value) || value < min)) {
            isValid = false;
            errorMessage = this.translations[this.currentLang].errorInvalidNumber || `Введите число больше ${min}`;
        }
        // Special validation for end mileage
        else if (input.id === 'end-mileage' && input.value) {
            const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
            if (value <= startMileage) {
                isValid = false;
                errorMessage = this.translations[this.currentLang].errorEndMileage || 'Конечный пробег должен быть больше начального';
            }
        }
        // Highway km validation
        else if (input.id === 'highway-km' && input.value) {
            const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
            const endMileage = parseFloat(this.elements.inputs.endMileage.value) || 0;
            const totalDistance = endMileage - startMileage;
            if (value > totalDistance && totalDistance > 0) {
                isValid = false;
                errorMessage = 'Километры по трассе не могут превышать общий пробег';
            }
        }
        // Reasonable limits check
        else if (input.value) {
            if (input.id.includes('mileage') && value > 999999) {
                isValid = false;
                errorMessage = 'Слишком большое значение пробега';
            }
            if (input.id === 'start-fuel' && (value > 200 || value < 0.1)) {
                isValid = false;
                errorMessage = 'Объем топлива должен быть от 0.1 до 200 литров';
            }
            if (input.id === 'fuel-price' && (value > 200 || value < 10)) {
                isValid = false;
                errorMessage = 'Цена топлива должна быть от 10 до 200 руб/л';
            }
        }

        // Display error
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }

        // Visual indication
        input.classList.toggle('error', !isValid);
        input.classList.toggle('valid', isValid && input.value);
        
        return isValid;
    }

    handleInputFocus(input) {
        // Clear previous errors on focus
        const errorElement = document.getElementById(`${input.id}-error`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        input.classList.remove('error');
    }

    calculateFuelConsumption() {
        try {
            this.showLoading();
            
            // Validate all inputs
            let allValid = true;
            const requiredInputs = ['startMileage', 'endMileage', 'startFuel'];
            
            Object.entries(this.elements.inputs).forEach(([key, input]) => {
                if (input) {
                    // Set required attribute for required fields
                    if (requiredInputs.includes(key)) {
                        input.setAttribute('required', 'true');
                    }
                    if (!this.validateInput(input)) allValid = false;
                }
            });

            if (!allValid) {
                this.hideLoading();
                this.showError('Пожалуйста, исправьте ошибки в форме');
                return;
            }

            // Get values
            const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
            const endMileage = parseFloat(this.elements.inputs.endMileage.value) || 0;
            const startFuel = parseFloat(this.elements.inputs.startFuel.value) || 0;
            const highwayKm = parseFloat(this.elements.inputs.highwayKm.value) || 0;

            // Additional logic validation
            if (endMileage <= startMileage || startFuel <= 0) {
                this.showError(this.translations[this.currentLang]["result-invalid"] || 'Введите корректные данные');
                this.hideLoading();
                return;
            }

            // Calculations
            const totalDistance = endMileage - startMileage;
            const cityKm = Math.max(0, totalDistance - highwayKm);

            // Realistic fuel consumption factors
            const fuelFactors = {
                city: 1.4,          // City: +40% (traffic, lights, frequent stops)
                highway: 0.75,      // Highway: -25% (constant speed)
                mixed: 1.0,         // Mixed: baseline
                winter: 1.15,       // Winter: +15% (heating, warm-up)
                summer: 1.05        // Summer: +5% (AC)
            };

            // Determine trip type and calculate
            let adjustedDistance;
            let drivingMode = '';
            let modeDescription = '';

            if (highwayKm > 0 && cityKm > 0) {
                // Mixed trip
                adjustedDistance = (cityKm * fuelFactors.city + highwayKm * fuelFactors.highway);
                drivingMode = 'mixed';
                modeDescription = `Смешанный режим: ${cityKm.toFixed(1)} км город, ${highwayKm.toFixed(1)} км трасса`;
            } else if (highwayKm > 0 && cityKm === 0) {
                // Highway only
                adjustedDistance = totalDistance * fuelFactors.highway;
                drivingMode = 'highway';
                modeDescription = `Трасса: ${totalDistance.toFixed(1)} км`;
            } else {
                // City only
                adjustedDistance = totalDistance * fuelFactors.city;
                drivingMode = 'city';
                modeDescription = `Город: ${totalDistance.toFixed(1)} км`;
            }

            // Main consumption calculations
            const baseConsumption = (startFuel / totalDistance) * 100;
            const adjustedConsumption = adjustedDistance > 0 ? 
                (startFuel / adjustedDistance) * 100 : baseConsumption;

            // Efficiency rating system
            let efficiencyData = this.calculateEfficiencyRating(adjustedConsumption);

            // Trip cost calculation
            let costData = this.calculateTripCost(startFuel, adjustedConsumption, totalDistance);

            // Additional statistics
            const additionalStats = {
                co2Emission: (startFuel * 2.31).toFixed(1), // kg CO2
                fuelEfficiency: (totalDistance / startFuel).toFixed(1), // km/l
                avgSpeed: drivingMode === 'highway' ? '90' : drivingMode === 'city' ? '30' : '60',
                fuelSaved: drivingMode === 'highway' ? ((baseConsumption - adjustedConsumption) * totalDistance / 100 * 50).toFixed(0) : '0'
            };

            // Prepare calculation data for history
            const calculationData = {
                startMileage, endMileage, startFuel, highwayKm, cityKm,
                totalDistance, baseConsumption, adjustedConsumption,
                drivingMode, efficiencyLevel: efficiencyData.level,
                cost: costData ? costData.totalCost : null
            };

            // Show results with delay for better UX
            setTimeout(() => {
                this.updateCalculatorResults({
                    totalDistance,
                    baseConsumption,
                    adjustedConsumption,
                    highwayKm,
                    cityKm,
                    efficiency: efficiencyData,
                    cost: costData,
                    mode: modeDescription,
                    stats: additionalStats,
                    drivingMode
                });
                
                this.hideLoading();
                
                // Save to history
                this.saveCalculationHistory(calculationData);
                
                // Announce result for screen readers
                this.announceToScreenReader(
                    `Расчет завершен. Расход топлива: ${adjustedConsumption.toFixed(2)} литров на 100 километров. ${efficiencyData.text}`
                );
                
                // Analytics
                this.trackEvent('fuel_calculation', {
                    totalDistance: totalDistance.toFixed(1),
                    consumption: adjustedConsumption.toFixed(2),
                    cityKm: cityKm.toFixed(1),
                    highwayKm: highwayKm.toFixed(1),
                    drivingMode,
                    efficiency: efficiencyData.level
                });
            }, 800);

        } catch (error) {
            this.hideLoading();
            this.showError('Произошла ошибка при расчете. Попробуйте еще раз.');
            console.error('Calculation error:', error);
        }
    }

    calculateEfficiencyRating(consumption) {
        let level, color, text, tips;

        if (consumption < 5) {
            level = 'excellent';
            color = '🟢';
            text = 'Отлично! Очень экономичный расход';
            tips = ['Поддерживайте текущий стиль вождения', 'Регулярно проверяйте давление в шинах'];
        } else if (consumption < 7) {
            level = 'good';
            color = '🟢';
            text = 'Хорошо! Экономичный расход';
            tips = ['Избегайте резких ускорений', 'Планируйте маршруты заранее'];
        } else if (consumption < 9) {
            level = 'average';
            color = '🟡';
            text = 'Средний расход топлива';
            tips = ['Больше используйте трассы', 'Проверьте техническое состояние авто'];
        } else if (consumption < 12) {
            level = 'high';
            color = '🟠';
            text = 'Повышенный расход';
            tips = ['Избегайте поездок в час пик', 'Проверьте воздушный фильтр'];
        } else {
            level = 'very-high';
            color = '🔴';
            text = 'Высокий расход топлива';
            tips = ['Обратитесь к автомеханику', 'Пересмотрите стиль вождения'];
        }

        return { level, color, text, tips, consumption };
    }

    calculateTripCost(fuelUsed, consumption, distance) {
        const fuelPriceInput = this.elements.inputs.fuelPrice;
        
        if (!fuelPriceInput || !fuelPriceInput.value) {
            return null;
        }

        const fuelPrice = parseFloat(fuelPriceInput.value);
        const totalCost = fuelUsed * fuelPrice;
        const costPer100km = (consumption / 100) * distance * fuelPrice;
        const costPerKm = totalCost / distance;

        return {
            totalCost: totalCost.toFixed(0),
            costPer100km: costPer100km.toFixed(0),
            costPerKm: costPerKm.toFixed(1),
            fuelPrice
        };
    }

    updateCalculatorResults(data) {
        const {
            totalDistance, baseConsumption, adjustedConsumption,
            highwayKm, cityKm, efficiency, cost, mode, stats, drivingMode
        } = data;

        const lang = this.currentLang;
        const translations = this.translations[lang];
        
        // Display total distance and breakdown
        if (this.elements.results.totalMileage) {
            this.elements.results.totalMileage.innerHTML = `
                <div class="distance-summary">
                    <h4>📏 ${translations['distance-summary'] || 'Информация о поездке'}</h4>
                    <div class="distance-main">${totalDistance.toFixed(1)} км</div>
                    <div class="distance-breakdown">${mode}</div>
                </div>
            `;
        }
        
        // Main calculation results
        if (this.elements.results.result && totalDistance > 0) {
            let resultHTML = `
                <div class="result-container">
                    <!-- Main result -->
                    <div class="result-main">
                        <div class="consumption-display">
                            <span class="consumption-value">${adjustedConsumption.toFixed(2)}</span>
                            <span class="consumption-unit">л/100км</span>
                        </div>
                    </div>

                    <!-- Efficiency rating -->
                    <div class="efficiency-section">
                        <div class="efficiency-badge ${efficiency.level}">
                            ${efficiency.color} ${efficiency.text}
                        </div>
                    </div>

                    <!-- Trip cost -->
                    ${cost ? `
                        <div class="cost-section">
                            <h5>💰 Стоимость поездки</h5>
                            <div class="cost-details">
                                <div>Общая стоимость: <strong>${cost.totalCost} руб</strong></div>
                                <div>На 100 км: ${cost.costPer100km} руб</div>
                                <div>За километр: ${cost.costPerKm} руб</div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Additional statistics -->
                    <div class="stats-section">
                        <h5>📊 Статистика поездки</h5>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Экономичность:</span>
                                <span class="stat-value">${stats.fuelEfficiency} км/л</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">CO₂ выброс:</span>
                                <span class="stat-value">${stats.co2Emission} кг</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Базовый расход:</span>
                                <span class="stat-value">${baseConsumption.toFixed(2)} л/100км</span>
                            </div>
                        </div>
                    </div>

                    <!-- Economy tips -->
                    <div class="tips-section">
                        <h5>💡 Советы по экономии</h5>
                        <ul class="tips-list">
                            ${efficiency.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>

                    <!-- Actions -->
                    <div class="result-actions">
                        <button class="btn secondary" onclick="fuelMasterApp.shareResult()" aria-label="Поделиться результатом">
                            <i class="fas fa-share" aria-hidden="true"></i> Поделиться
                        </button>
                        <button class="btn secondary" onclick="fuelMasterApp.clearCalculator()" aria-label="Очистить форму">
                            <i class="fas fa-refresh" aria-hidden="true"></i> Новый расчет
                        </button>
                    </div>
                </div>
            `;
            
            this.elements.results.result.innerHTML = resultHTML;
            
            // Result appearance animation
            this.elements.results.result.classList.remove('fade-in');
            setTimeout(() => {
                this.elements.results.result.classList.add('fade-in');
                
                // Smooth scroll to results
                this.elements.results.result.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 100);
        }
    }

    handleCalculatorInput(event) {
        const input = event.target;
        
        // Real-time validation
        this.validateInput(input);
        
        // Automatic calculation when main fields are filled
        const requiredFields = [
            this.elements.inputs.startMileage,
            this.elements.inputs.endMileage,
            this.elements.inputs.startFuel
        ];
        
        const allRequiredFilled = requiredFields.every(field => 
            field && field.value && parseFloat(field.value) > 0
        );
        
        if (allRequiredFilled) {
            // Show preview calculation
            const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
            const endMileage = parseFloat(this.elements.inputs.endMileage.value) || 0;
            const startFuel = parseFloat(this.elements.inputs.startFuel.value) || 0;
            
            if (endMileage > startMileage && startFuel > 0) {
                const totalDistance = endMileage - startMileage;
                const quickConsumption = (startFuel / totalDistance) * 100;
                
                // Show quick calculation
                if (this.elements.results.totalMileage) {
                    this.elements.results.totalMileage.innerHTML = `
                        <div class="quick-preview">
                            📏 Пробег: ${totalDistance.toFixed(1)} км
                            <small style="display: block; margin-top: 5px; opacity: 0.7;">
                                Предварительный расход: ~${quickConsumption.toFixed(1)} л/100км
                            </small>
                        </div>
                    `;
                }
            }
        }
        
        // Auto-adjust highway km
        if (input.id === 'end-mileage') {
            const startMileage = parseFloat(this.elements.inputs.startMileage.value) || 0;
            const endMileage = parseFloat(input.value) || 0;
            
            // Check highway km logic
            if (this.elements.inputs.highwayKm.value) {
                const highway = parseFloat(this.elements.inputs.highwayKm.value);
                const totalDistance = endMileage - startMileage;
                
                if (highway > totalDistance && totalDistance > 0) {
                    this.elements.inputs.highwayKm.value = totalDistance;
                    this.validateInput(this.elements.inputs.highwayKm);
                }
            }
        }
    }

    // Calculator utility methods
    clearCalculator() {
        Object.values(this.elements.inputs).forEach(input => {
            if (input) {
                input.value = '';
                input.classList.remove('valid', 'error');
                const errorElement = document.getElementById(`${input.id}-error`);
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }
        });
        
        if (this.elements.results.totalMileage) {
            this.elements.results.totalMileage.innerHTML = '';
        }
        if (this.elements.results.result) {
            this.elements.results.result.innerHTML = '';
        }
        
        // Focus on first input
        if (this.elements.inputs.startMileage) {
            this.elements.inputs.startMileage.focus();
        }
        
        this.trackEvent('calculator_cleared');
    }

    shareResult() {
        if (!this.elements.results.result.textContent) return;
        
        const resultText = this.elements.results.result.textContent
            .replace(/\s+/g, ' ').trim();
        
        if (navigator.share) {
            navigator.share({
                title: 'FuelMaster - Расчет расхода топлива',
                text: resultText,
                url: window.location.href
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(resultText).then(() => {
                this.showError('Результат скопирован в буфер обмена', 'success');
            }).catch(() => {
                this.showError('Не удалось скопировать результат');
            });
        }
        
        this.trackEvent('result_shared');
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
        const windSpeed = Math.round(data.current_weather.windspeed);

        // Weather icon mapping
        let icon = '☀️';
        if (weatherCode >= 51 && weatherCode <= 67) icon = '🌧️';
        else if (weatherCode >= 71 && weatherCode <= 77) icon = '❄️';
        else if (weatherCode >= 80 && weatherCode <= 82) icon = '🌦️';
        else if (weatherCode >= 95) icon = '⛈️';
        else if (weatherCode >= 1 && weatherCode <= 3) icon = '⛅';

        return { temp, icon, city: cityName, windSpeed, code: weatherCode };
    }

    displayWeather(weatherInfo) {
        const translations = this.translations[this.currentLang];
        this.elements.weatherInfo.innerHTML = `
            <span class="weather-location">${weatherInfo.city}</span>
            <span class="weather-temp">${weatherInfo.icon} ${weatherInfo.temp}°C</span>
            <span class="weather-wind">💨 ${weatherInfo.windSpeed} км/ч</span>
        `;
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
                case 'Enter':
                    if (document.activeElement && document.activeElement.closest('.calculator-form')) {
                        e.preventDefault();
                        this.calculateFuelConsumption();
                    }
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

    pauseAnimations() {
        document.body.classList.add('animations-paused');
    }

    resumeAnimations() {
        document.body.classList.remove('animations-paused');
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

    showError(message, type = 'error') {
        if (this.elements.errorNotification && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorNotification.classList.remove('success');
            if (type === 'success') {
                this.elements.errorNotification.classList.add('success');
            }
            this.elements.errorNotification.classList.add('show');
            this.elements.errorNotification.setAttribute('aria-hidden', 'false');
            
            // Auto-hide after 5 seconds
            if (this.errorTimeout) clearTimeout(this.errorTimeout);
            this.errorTimeout = setTimeout(() => this.hideError(), 5000);
        }
    }

    hideError() {
        if (this.elements.errorNotification) {
            this.elements.errorNotification.classList.remove('show', 'success');
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
        
        // Google Analytics 4 integration
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...properties,
                timestamp: Date.now(),
                user_agent: navigator.userAgent,
                language: this.currentLang,
                theme: this.currentTheme
            });
        }
        
        // Custom analytics can be added here
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
            "fuel-price": "Цена топлива (руб/л)",
            "calculate-btn": "Рассчитать",
            "distance-summary": "Информация о поездке",
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
            "weather-info": "{city}: {icon} {temp}°C, {wind} км/ч",
            "errorRequired": "Это поле обязательно",
            "errorInvalidNumber": "Введите корректное число",
            "errorEndMileage": "Конечный пробег должен быть больше начального"
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
            "fuel-price": "Fuel Price (RUB/l)",
            "calculate-btn": "Calculate",
            "distance-summary": "Trip Information",
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
            "weather-info": "{city}: {icon} {temp}°C, {wind} km/h",
            "errorRequired": "This field is required",
            "errorInvalidNumber": "Enter a valid number",
            "errorEndMileage": "End mileage must be greater than start mileage"
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
        console.log('FuelMaster app initialized successfully v2.0');
    } catch (error) {
        console.error('Failed to initialize FuelMaster app:', error);
        
        // Fallback error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #ff6b6b;
            color: white; padding: 15px; border-radius: 5px; z-index: 9999;
            max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            <strong>Ошибка загрузки</strong><br>
            Пожалуйста, обновите страницу или проверьте подключение к интернету.
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 8000);
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

// === PERFORMANCE MONITORING ===
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData && fuelMasterApp) {
                fuelMasterApp.trackEvent('page_performance', {
                    loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                    domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                    totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
                });
            }
        }, 1000);
    });
}
