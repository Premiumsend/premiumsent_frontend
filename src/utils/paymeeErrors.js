/** Paymee USDT balans yetarli emas — backend `code` */
export function isPaymeeInsufficientError(data) {
  return data?.code === "PAYMEE_INSUFFICIENT_BALANCE";
}

const FALLBACK_BY_PRODUCT = {
  stars:
    "⭐ Afsuski, botda Stars tugab qoldi.\n\nAdmin hozir to'ldirmoqda — birozdan keyin yana urinib ko'ring! 🙏",
  premium:
    "💎 Afsuski, botda Premium vaqtincha tugagan.\n\nBirozdan keyin qayta urinib ko'ring! ✨",
  gift:
    "🎁 Afsuski, botda Gift tugab qoldi.\n\nBirozdan keyin yana urinib ko'ring! 🙏",
};

export function paymeeInsufficientAlertMessage(data) {
  if (data?.error) return data.error;
  const product = data?.product;
  if (product && FALLBACK_BY_PRODUCT[product]) {
    return FALLBACK_BY_PRODUCT[product];
  }
  return FALLBACK_BY_PRODUCT.stars;
}
