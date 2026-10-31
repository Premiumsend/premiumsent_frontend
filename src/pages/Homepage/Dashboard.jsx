import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import apiFetch from "../../utils/apiFetch";
import { getPremiumPurchasePath, getStarsPurchasePath } from "../../utils/starsPurchaseRoute";
import { Ads, Dust, LanguageModal, Modal, Shell, SupportCard, Tabs, fmt } from "../../ui/Kit";
import { GlobeIcon, TgStar, Wordmark } from "../../ui/Brand";

const GUIDE = [
  ["Mahsulotni tanlang", "Premium yoki Stars"],
  ["Username kiriting", "O'zingizga yoki do'stingizga"],
  ["Buyurtma oching", "Sizga aniq summa beriladi"],
  ["Kartaga pul o'tkazing", "Summani aynan shunday yozing"],
  ["Tayyor", "To'lovdan keyin avtomatik yuboriladi"],
];

const SPLASH_MS = 1200;

export default function Dashboard() {
  const navigate = useNavigate();
  const [splashVisible, setSplashVisible] = useState(() => !sessionStorage.getItem("splashShown"));
  const [guideOpen, setGuideOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [premiumPurchasePath, setPremiumPurchasePath] = useState("/premium");
  const [starsPurchasePath, setStarsPurchasePath] = useState("/stars");
  const NARX = parseInt(import.meta.env.VITE_NARX) || 300;

  // Register user (silent)
  const registerUser = async (user) => {
    try {
      // Check URL parameters for referral code (startapp param in Telegram)
      const params = new URLSearchParams(window.location.search);
      const startParam = WebApp?.initDataUnsafe?.start_param || params.get("startapp") || params.get("ref");

      await apiFetch("/api/referral/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          referral_code: startParam || null,
        }),
      });
    } catch (err) {
      console.error("Auto-register error:", err);
    }
  };

  const loadPurchasePaths = () => {
    apiFetch("/api/app-config")
      .then((r) => r.json())
      .then((cfg) => {
        setPremiumPurchasePath(getPremiumPurchasePath(cfg));
        setStarsPurchasePath(getStarsPurchasePath(cfg));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadPurchasePaths();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadPurchasePaths();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  /* ================= TELEGRAM USER ================= */
  useEffect(() => {
    try {
      WebApp.ready();
      const tgUser =
        WebApp?.initDataUnsafe?.user?.username ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;
      const tgUserId =
        WebApp?.initDataUnsafe?.user?.id ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;

      if (tgUser) {
        const clean = tgUser.replace("@", "");
        localStorage.setItem("username", clean);
        if (tgUserId) localStorage.setItem("userId", String(tgUserId));
        registerUser(clean);
      }
    } catch {
      // Telegram tashqarisi
    }
  }, []);

  useEffect(() => {
    if (!splashVisible) return undefined;
    const id = setTimeout(() => {
      setSplashVisible(false);
      sessionStorage.setItem("splashShown", "1");
    }, SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  if (splashVisible) {
    return (
      <Shell>
        <div className="pn-splash">
          <Wordmark />
          <div className="pn-splash__bar"><i /></div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="pn-scroll pn-scroll--tabs pn-home">
        <header className="pn-top">
          <span className="pn-brand"><Wordmark /></span>
          <button type="button" className="pn-guide-btn" onClick={() => setGuideOpen(true)}>Qo'llanma</button>
          <button type="button" className="pn-round" onClick={() => setLanguageOpen(true)} aria-label="Til"><GlobeIcon size={20} /></button>
        </header>

        <main className="pn-main">
          <Ads />
          <div className="pn-tiles">
            <button type="button" className="pn-tile" onClick={() => navigate(premiumPurchasePath)}>
              <span className="pn-star-dust"><TgStar size={72} accent /><Dust /></span>
              <b>Premium</b>
              <span>{fmt(import.meta.env.VITE_PREMIUM_3)} so'mdan</span>
            </button>
            <button type="button" className="pn-tile pn-tile--stars" onClick={() => navigate(starsPurchasePath)}>
              <span className="pn-star-dust pn-star-dust--gold"><TgStar size={72} /><Dust /></span>
              <b>Stars</b>
              <span>{fmt(50 * NARX)} so'mdan</span>
            </button>
          </div>
          <SupportCard />
        </main>
      </div>
      <Tabs active="home" />
      {guideOpen && (
        <Modal title="Qanday ishlaydi?" onClose={() => setGuideOpen(false)}>
          <ol className="pn-steps">
            {GUIDE.map(([title, sub], i) => <li key={title} className="is-key"><i>{i + 1}</i><span><b>{title}</b>{sub}</span></li>)}
          </ol>
        </Modal>
      )}
      {languageOpen && <LanguageModal onClose={() => setLanguageOpen(false)} />}
    </Shell>
  );
}
