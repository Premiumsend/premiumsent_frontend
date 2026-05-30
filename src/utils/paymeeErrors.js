/** Paymee USDT balans yetarli emas — backend `code` */
export function isPaymeeInsufficientError(data) {
  return data?.code === "PAYMEE_INSUFFICIENT_BALANCE";
}

/** Matn (emoji yo'q — ikonka Lottie/TGS orqali) */
export const PAYMEE_STOCK_TEXT = {
  stars:
    "Afsuski, botda Stars tugab qoldi. Admin hozir to'ldirmoqda — birozdan keyin yana urinib ko'ring!",
  premium:
    "Afsuski, botda Premium tugap qoldi. Admin hozir to'ldirmoqda — birozdan keyin yana urinib ko'ring!",
  gift:
    "Afsuski, botda sovga tugap qoldi. Admin hozir to'ldirmoqda — birozdan keyin yana urinib ko'ring!",
};

/**
 * @param {object} [data] — API javob
 * @param {'stars'|'premium'|'gift'} [productHint]
 */
export function paymeeInsufficientAlertMessage(data, productHint) {
  const text = data?.error || data?.message;
  if (text) return stripStockEmojis(text);

  const product = data?.product || productHint;
  if (product && PAYMEE_STOCK_TEXT[product]) {
    return PAYMEE_STOCK_TEXT[product];
  }
  return PAYMEE_STOCK_TEXT.stars;
}

/** Eski backend javoblaridagi emoji belgilarni olib tashlash */
function stripStockEmojis(text) {
  return String(text)
    .replace(/^[\s⭐💎🎁]+/u, "")
    .replace(/\s*🙏\s*✨?\s*$/u, "")
    .trim();
}
