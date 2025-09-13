// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("✅ Service Worker зарегистрирован"))
    .catch(err => console.error("❌ Ошибка SW:", err));
}

// Установка PWA (Add to Home Screen)
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;

  installBtn.addEventListener("click", () => {
    installBtn.hidden = true;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === "accepted") {
        console.log("📲 Пользователь установил PWA");
      } else {
        console.log("❌ Установка отклонена");
      }
      deferredPrompt = null;
    });
  });
});
