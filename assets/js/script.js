document.addEventListener("DOMContentLoaded", () => {
    const languageToggle = document.getElementById("language-toggle");
    const themeToggle = document.getElementById("theme-toggle");
    const themeText = document.getElementById("theme-text");

    const totalMileageEl = document.getElementById("total-mileage");
    const resultEl = document.getElementById("result");

    const translations = {
        ru: {
            "theme-light": "Светлая",
            "theme-dark": "Тёмная",
            "seasonal-banner": "Осенние обновления 2025: Улучшенный расчет и новые советы по экономии до 30 сентября!",
            "hero-title": "Управляй расходом топлива с умом",
            "hero-subtitle": "FuelMaster — комплексное приложение для отслеживания автомобилей, расчета топлива и полезных советов.",
            "download-text": "Скачать",
            "calculator-title": "Рассчитайте расход топлива",
            "features-title": "Основные возможности",
            "screenshots-title": "Скриншоты",
            "testimonials-title": "Отзывы пользователей",
            "download-title": "Скачай FuelMaster",
            "download-desc": "Доступно для Android и iOS. Установи прямо сейчас!",
            "source-code-text": "Исходный код",
            "apk-text": "Скачать APK",
            "total-mileage": (km) => `Общий километраж: ${km} км`,
            "result": (consumption, highway, city) => 
                `Полный расчет: расход ${consumption} л/100 км (трасса: ${highway} км, город: ${city} км).`
        },
        en: {
            "theme-light": "Light",
            "theme-dark": "Dark",
            "seasonal-banner": "Autumn updates 2025: Improved calculation and new saving tips until September 30!",
            "hero-title": "Manage fuel consumption wisely",
            "hero-subtitle": "FuelMaster — a comprehensive app for tracking cars, calculating fuel, and useful tips.",
            "download-text": "Download",
            "calculator-title": "Calculate fuel consumption",
            "features-title": "Main Features",
            "screenshots-title": "Screenshots",
            "testimonials-title": "User Reviews",
            "download-title": "Download FuelMaster",
            "download-desc": "Available for Android and iOS. Install now!",
            "source-code-text": "Source Code",
            "apk-text": "Download APK",
            "total-mileage": (km) => `Total Mileage: ${km} km`,
            "result": (consumption, highway, city) => 
                `Full calculation: consumption ${consumption} L/100 km (highway: ${highway} km, city: ${city} km).`
        }
    };

    function applyTranslations(lang) {
        document.getElementById("hero-title").textContent = translations[lang]["hero-title"];
        document.getElementById("hero-subtitle").textContent = translations[lang]["hero-subtitle"];
        document.getElementById("download-text").textContent = translations[lang]["download-text"];
        document.getElementById("calculator-title").textContent = translations[lang]["calculator-title"];
        document.getElementById("features-title").textContent = translations[lang]["features-title"];
        document.getElementById("screenshots-title").textContent = translations[lang]["screenshots-title"];
        document.getElementById("testimonials-title").textContent = translations[lang]["testimonials-title"];
        document.getElementById("download-title").textContent = translations[lang]["download-title"];
        document.getElementById("download-desc").textContent = translations[lang]["download-desc"];
        document.getElementById("seasonal-banner").textContent = translations[lang]["seasonal-banner"];
        document.getElementById("source-code-text").textContent = translations[lang]["source-code-text"];
        document.getElementById("apk-text").textContent = translations[lang]["apk-text"];

        if (document.body.classList.contains("light")) {
            themeText.textContent = translations[lang]["theme-light"];
        } else {
            themeText.textContent = translations[lang]["theme-dark"];
        }

        // обновляем перевод для результатов калькулятора
        if (totalMileageEl.dataset.km !== undefined) {
            totalMileageEl.textContent = translations[lang]["total-mileage"](totalMileageEl.dataset.km);
        }
        if (resultEl.dataset.consumption !== undefined) {
            resultEl.textContent = translations[lang]["result"](
                resultEl.dataset.consumption,
                resultEl.dataset.highway,
                resultEl.dataset.city
            );
        }
    }

    languageToggle.addEventListener("change", (e) => {
        const lang = e.target.value;
        applyTranslations(lang);
    });

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light");
        const lang = languageToggle.value;
        if (document.body.classList.contains("light")) {
            themeText.textContent = translations[lang]["theme-light"];
        } else {
            themeText.textContent = translations[lang]["theme-dark"];
        }
    });

    // калькулятор
    document.getElementById("calculate-btn").addEventListener("click", () => {
        const startMileage = parseFloat(document.getElementById("start-mileage").value) || 0;
        const endMileage = parseFloat(document.getElementById("end-mileage").value) || 0;
        const startFuel = parseFloat(document.getElementById("start-fuel").value) || 0;
        const highwayKm = parseFloat(document.getElementById("highway-km").value) || 0;

        const totalMileage = Math.max(endMileage - startMileage, 0);
        const cityKm = Math.max(totalMileage - highwayKm, 0);
        let consumption = "NaN";

        if (totalMileage > 0) {
            consumption = ((startFuel / totalMileage) * 100).toFixed(2);
        }

        const lang = languageToggle.value;

        totalMileageEl.dataset.km = totalMileage;
        totalMileageEl.textContent = translations[lang]["total-mileage"](totalMileage);

        resultEl.dataset.consumption = consumption;
        resultEl.dataset.highway = highwayKm;
        resultEl.dataset.city = cityKm;
        resultEl.textContent = translations[lang]["result"](consumption, highwayKm, cityKm);
    });

    // начальные значения (0 км, 0 расход)
    totalMileageEl.dataset.km = 0;
    resultEl.dataset.consumption = "NaN";
    resultEl.dataset.highway = 0;
    resultEl.dataset.city = 0;

    applyTranslations("ru");
});
