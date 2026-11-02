/**
 * 💳 To'lov kartasi.
 *
 * Yagona manba: `/api/app-config`, karta avtomatik almashganda rebuild kerak bo'lmasin.
 * Karta kelmaguncha placeholder ko'rsatiladi, sahifa uzoq ochiq tursa ham
 * (60s interval + fokusga qaytish) yangilanadi.
 */
import { useEffect, useState } from "react";
import apiFetch from "./apiFetch";

const REFRESH_MS = 60_000;
const RETRY_MS = 2_500;

const EMPTY_CARD = {
  cardNumber: "",
  cardName: "",
  provider: "",
  providerLabel: "",
  loading: true,
  error: false,
};

export function usePaymentCard() {
  const [card, setCard] = useState(EMPTY_CARD);

  useEffect(() => {
    let alive = true;
    let retried = false;
    let retryTimer = null;

    const load = async () => {
      try {
        const res = await apiFetch("/api/app-config");
        const cfg = await res.json();
        if (!alive) return;
        if (!cfg?.card_number) throw new Error("app-config: card_number yo'q");

        retried = false;
        setCard({
          cardNumber: String(cfg.card_number),
          cardName: cfg.card_name || "",
          provider: cfg.card_provider || "",
          providerLabel: cfg.card_provider_label || "",
          loading: false,
          error: false,
        });
      } catch (err) {
        if (!alive) return;
        console.error("💳 Karta ma'lumoti olinmadi:", err?.message || err);

        // Karta allaqachon olingan bo'lsa — eskisini saqlaymiz, aks holda xato holati
        setCard((prev) =>
          prev.cardNumber ? prev : { ...EMPTY_CARD, loading: false, error: true }
        );

        // Bir marta tezkor qayta urinish, keyin 60s interval o'z ishini qiladi
        if (!retried) {
          retried = true;
          retryTimer = setTimeout(load, RETRY_MS);
        }
      }
    };

    load();

    const interval = setInterval(load, REFRESH_MS);
    // focus va visibilitychange birga ishga tushadi; ilovalar orasida tez o'tilganda
    // so'rovlar ko'payib rate limit'ga tushmasin — 15 soniyada ko'pi bilan 1 marta
    let lastFocusLoad = 0;
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastFocusLoad < 15_000) return;
      lastFocusLoad = now;
      load();
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearTimeout(retryTimer);
      clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return {
    ...card,
    // JSX uchun tayyor matn — karta kelmaguncha raqam o'rniga holat ko'rsatiladi
    cardNumberDisplay: card.cardNumber || (card.error ? "⚠️ Yuklanmadi" : "⏳ Yuklanmoqda..."),
    cardNameDisplay: card.cardName || (card.error ? "⚠️" : "..."),
    ready: Boolean(card.cardNumber),
  };
}
