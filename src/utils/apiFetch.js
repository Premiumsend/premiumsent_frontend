/**
 * 🛡️ SECURITY: Xavfsiz API fetch wrapper
 * 
 * Har bir API so'roviga Telegram WebApp initData ni avtomatik qo'shadi.
 * Bu backendda foydalanuvchi haqiqiyligini tekshirish uchun kerak.
 */
export default function apiFetch(url, options = {}) {
  const initData = window?.Telegram?.WebApp?.initData || '';

  const headers = {
    ...options.headers,
  };

  // initData mavjud bo'lsa, headerga qo'shamiz
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
