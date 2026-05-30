/** Paymee USDT balans yetarli emas — backend `code` */
export function isPaymeeInsufficientError(data) {
  return data?.code === "PAYMEE_INSUFFICIENT_BALANCE";
}

export function paymeeInsufficientAlertMessage(data) {
  return (
    data?.error ||
    "Afsuski, xizmat vaqtincha to'xtatilgan. Admin to'ldirmoqda. Keyinroq qayta urinib ko'ring."
  );
}
