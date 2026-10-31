import WebApp from "@twa-dev/sdk";

/**
 * Telegram oynasi sozlamalari: ranglar, fullscreen va chiqishda tasdiq.
 * Eski klientlarda ba'zi metodlar yo'q yoki xato tashlaydi — shu sabab har biri alohida o'ralgan.
 */
export const APP_BG = "#090d18";

function safely(fn) {
  try {
    fn();
  } catch {
    // Eski klient yoki Telegram tashqarisi — jim o'tkazib yuboramiz
  }
}

export function applyTelegramChrome() {
  safely(() => WebApp.setBackgroundColor(APP_BG));
  safely(() => WebApp.setHeaderColor(APP_BG));
  safely(() => {
    if (typeof WebApp.setBottomBarColor === "function") WebApp.setBottomBarColor(APP_BG);
  });
}

export function setupTelegramApp() {
  applyTelegramChrome();
  safely(() => WebApp.expand());

  // Admin panel fullscreen uchun moslanmagan: sarlavhasi Telegram tugmalari ostida qolardi
  const isAdmin = window.location.pathname.startsWith("/starsadmin");
  if (!isAdmin) {
    safely(() => {
      if (typeof WebApp.requestFullscreen !== "function") return;
      if (typeof WebApp.isVersionAtLeast === "function" && !WebApp.isVersionAtLeast("8.0")) return;
      WebApp.requestFullscreen();
    });
  }

  // Yopishda Telegram'ning o'zi tasdiq so'raydi
  safely(() => {
    if (typeof WebApp.enableClosingConfirmation === "function") WebApp.enableClosingConfirmation();
  });
  // Scroll qilganda ilova tasodifan yopilmasin
  safely(() => {
    if (typeof WebApp.disableVerticalSwipes === "function") WebApp.disableVerticalSwipes();
  });
}
