document.addEventListener("DOMContentLoaded", function () {
    const langButtons = document.querySelectorAll(".lang-btn");
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    const translations = {
        ru: {
            light: "Светлая",
            dark: "Тёмная",
            banner: "Осенние обновления 2025: Улучшенный расчёт и новые советы по экономии до 30 сентября!",
            calcTitle: "## Рассчитать расход топлива",
            totalMileage: "Общий километраж: {value} км",
            fullCalc: "Полный расчёт: расход {consumption} л/100 км (трасса: {highway} км, город: {city} км).",
            features: "## Основные возможности",
            feature1: "### Управление авто",
            feature1_desc: "Добавление, редактирование, удаление автомобилей с базой моделей из CSV.",
            feature2: "### Расчёт расхода",
            feature2_desc: "Учёт города/трассы, погоды, кондиционера и других факторов.",
            feature3: "### История и графики",
            feature3_desc: "Хранение, фильтры и визуализация с fl_chart.",
            feature4: "### Безопасность и премиум",
            feature4_desc: "Firebase вход, синхронизация с Firestore для премиум.",
            reviews: "## Отзывы пользователей",
            download: "## Скачать FuelMaster",
            sourceCode: "Исходный код",
            downloadApk: "Скачать APK",
        },
        en: {
            light: "Light",
            dark: "Dark",
            banner: "Autumn updates 2025: Improved calculation and new saving tips until September 30!",
            calcTitle: "## Calculate fuel consumption",
            totalMileage: "Total Mileage: {value} km",
            fullCalc: "Full calculation: consumption {consumption} L/100 km (highway: {highway} km, city: {city} km).",
            features: "## Main Features",
            feature1: "### Car Management",
            feature1_desc: "Add, edit, delete cars with a built-in CSV model database.",
            feature2: "### Fuel Calculation",
            feature2_desc: "Takes into account highway/city, weather, AC, and other factors.",
            feature3: "### History and Charts",
            feature3_desc: "Storage, filters, and visualization with fl_chart.",
            feature4: "### Security and Premium",
            feature4_desc: "Firebase login, Firestore sync for premium.",
            reviews: "## User Reviews",
            download: "## Download FuelMaster",
            sourceCode: "Source Code",
            downloadApk: "Download APK",
        }
    };

    let currentLang = localStorage.getItem("lang") || "ru";

    function translatePage(lang) {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            let key = el.getAttribute("data-i18n");
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        const totalMileageEl = document.getElementById("total-mileage");
        const fullCalcEl = document.getElementById("full-calc");

        if (totalMileageEl && totalMileageEl.dataset.value !== undefined) {
            totalMileageEl.textContent = translations[lang].totalMileage
                .replace("{value}", totalMileageEl.dataset.value);
        }

        if (fullCalcEl && fullCalcEl.dataset.consumption !== undefined) {
            fullCalcEl.textContent = translations[lang].fullCalc
                .replace("{consumption}", fullCalcEl.dataset.consumption)
                .replace("{highway}", fullCalcEl.dataset.highway)
                .replace("{city}", fullCalcEl.dataset.city);
        }

        localStorage.setItem("lang", lang);
    }

    langButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            currentLang = btn.getAttribute("data-lang");
            translatePage(currentLang);
        });
    });

    themeToggle.addEventListener("click", () => {
        body.classList.toggle("light-theme");
        const isLight = body.classList.contains("light-theme");
        themeToggle.textContent = isLight
            ? translations[currentLang].dark
            : translations[currentLang].light;
    });

    translatePage(currentLang);
});
