// ================== Переводы ==================
const translations = {
    ru: {
        themeLight: "Светлая",
        themeDark: "Тёмная",
        "hero-title": "Управляй расходом топлива с умом",
        "hero-subtitle": "FuelMaster — комплексное приложение для отслеживания автомобилей, расчета топлива и полезных советов.",
        "download-text": "Скачать",
        "calculator-title": "Рассчитайте расход топлива",
        "features-title": "Основные возможности",
        "screenshots-title": "Скриншоты",
        "testimonials-title": "Отзывы пользователей",
        "download-title": "Скачай FuelMaster",
        "download-desc": "Доступно для Android и iOS. Установи прямо сейчас!",
        "feature1-title": "Управление авто",
        "feature1-desc": "Добавление, редактирование, удаление автомобилей с базой моделей из CSV.",
        "feature2-title": "Расчет расхода",
        "feature2-desc": "Учет города/трассы, погоды, кондиционера и других факторов.",
        "feature3-title": "История и графики",
        "feature3-desc": "Хранение, фильтры и визуализация с fl_chart.",
        "feature4-title": "Безопасность и премиум",
        "feature4-desc": "Firebase вход, синхронизация с Firestore для премиум.",
        "testimonial1-text": "Отлично помогает экономить топливо!",
        "testimonial1-author": "— Иван, Москва",
        "testimonial2-text": "Простое и удобное приложение!",
        "testimonial2-author": "— Ольга, Санкт-Петербург",
        "seasonal-banner": "Осенние обновления 2025: Улучшенный расчёт и новые советы по  экономии до 30 сентября!",
        totalMileage: "Общий километраж: {km} км",
        calculation: "Полный расчет: расход {consumption} л/100 км (трасса: {highway} км, город: {city} км).",
        "source-code": "Исходный код",
        "download-apk": "Скачать APK"
    },
    en: {
        themeLight: "Light",
        themeDark: "Dark",
        "hero-title": "Manage fuel consumption wisely",
        "hero-subtitle": "FuelMaster is a comprehensive app for tracking cars, calculating fuel and useful tips.",
        "download-text": "Download",
        "calculator-title": "Fuel consumption calculator",
        "features-title": "Main Features",
        "screenshots-title": "Screenshots",
        "testimonials-title": "User Reviews",
        "download-title": "Download FuelMaster",
        "download-desc": "Available for Android and iOS. Install now!",
        "feature1-title": "Car management",
        "feature1-desc": "Add, edit, delete cars with model database from CSV.",
        "feature2-title": "Fuel calculation",
        "feature2-desc": "Takes into account city/highway, weather, AC and other factors.",
        "feature3-title": "History and charts",
        "feature3-desc": "Storage, filters and visualization with fl_chart.",
        "feature4-title": "Security & premium",
        "feature4-desc": "Firebase login, Firestore sync for premium.",
        "testimonial1-text": "Helps save fuel a lot!",
        "testimonial1-author": "— Ivan, Moscow",
        "testimonial2-text": "Simple and convenient app!",
        "testimonial2-author": "— Olga, Saint Petersburg",
        "seasonal-banner": "Autumn updates 2025: Improved calculation and new saving tips until September 30!",
        totalMileage: "Total mileage: {km} km",
        calculation: "Full calculation: consumption {consumption} l/100 km (highway: {highway} km, city: {city} km).",
        "source-code": "Source Code",
        "download-apk": "Download APK"
    }
};

// ================== Переключение языка ==================
function changeLanguage(lang) {
    document.querySelectorAll("[id]").forEach(el => {
        const key = el.id;
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Обновляем текст кнопки темы
    updateThemeText(lang);

    // Обновляем баннер
    updateBanner(lang);

    // Обновляем кнопки загрузки
    updateDownloadButtons(lang);
}

// ================== Обновление текста темы ==================
function updateThemeText(lang) {
    const themeText = document.getElementById("theme-text");
    if (!themeText) return;

    if (document.body.classList.contains("light")) {
        themeText.textContent = translations[lang].themeDark;
    } else {
        themeText.textContent = translations[lang].themeLight;
    }
}

// ================== Обновление баннера ==================
function updateBanner(lang) {
    const banner = document.getElementById("seasonal-banner");
    if (banner && translations[lang]["seasonal-banner"]) {
        banner.innerHTML = translations[lang]["seasonal-banner"] + ' <span id="countdown"></span>';
    }
}

// ================== Переключение темы ==================
document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    const lang = document.getElementById("language-toggle").value || "ru";
    updateThemeText(lang);
});

// ================== Переключение языка ==================
document.getElementById("language-toggle").addEventListener("change", (e) => {
    changeLanguage(e.target.value);
});

// ================== Калькулятор ==================
document.getElementById("calculate-btn").addEventListener("click", () => {
    const startMileage = parseFloat(document.getElementById("start-mileage").value) || 0;
    const endMileage = parseFloat(document.getElementById("end-mileage").value) || 0;
    const startFuel = parseFloat(document.getElementById("start-fuel").value) || 0;
    const highwayKm = parseFloat(document.getElementById("highway-km").value) || 0;

    const totalKm = endMileage - startMileage;
    const cityKm = totalKm - highwayKm;

    let consumption = 0;
    if (totalKm > 0 && startFuel > 0) {
        consumption = ((startFuel / totalKm) * 100).toFixed(2);
    }

    const lang = document.getElementById("language-toggle").value || "ru";

    document.getElementById("total-mileage").textContent =
        translations[lang].totalMileage.replace("{km}", totalKm);

    document.getElementById("result").textContent =
        translations[lang].calculation
            .replace("{consumption}", consumption)
            .replace("{highway}", highwayKm)
            .replace("{city}", cityKm);
});

// ================== Перевод кнопок загрузки ==================
function updateDownloadButtons(lang) {
    const sourceBtn = document.querySelector(".btn.secondary");
    const apkBtn = document.querySelector(".btn.primary:last-of-type");

    if (sourceBtn) {
        sourceBtn.innerHTML = `<img src="assets/img/logo.PNG" alt="Logo" class="download-logo"> ${translations[lang]["source-code"]}`;
    }
    if (apkBtn) {
        apkBtn.innerHTML = `<img src="assets/img/logo.PNG" alt="Logo" class="download-logo"> ${translations[lang]["download-apk"]}`;
    }
}

// ================== Инициализация ==================
document.addEventListener("DOMContentLoaded", () => {
    const lang = document.getElementById("language-toggle").value || "ru";
    changeLanguage(lang);
});
