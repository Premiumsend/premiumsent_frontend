import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { useTranslation } from "../../context/LanguageContext";
import apiFetch from "../../utils/apiFetch";
import "./Dashboard.css";

import premiumGif from "../../assets/premium_gif.gif";
import profileIcon from "../../assets/profile_icon.png";
import menuIcon from "../../assets/main_icon.png";
import bellsIcon from "../../assets/bells_icon.png";
import statsIcon from "../../assets/stats_icon.png";
import langIcon from "../../assets/lang.png";
import ordersIcon from "../../assets/orders_icon.png";


// ================== UTILS ==================
const formatAmount = (num) =>
  Number(num || 0).toLocaleString("ru-RU");

// ================== COMPONENT ==================
export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();

  /* ================= USER ================= */
  const [username, setUsername] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);

  /* ================= DATA ================= */
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [history, setHistory] = useState([]);

  /* ================= UI ================= */
  const [tab, setTab] = useState("home"); // home | profile | history
  const [loading, setLoading] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [splashVisible, setSplashVisible] = useState(() => !sessionStorage.getItem("splashShown"));
  const [splashFading, setSplashFading] = useState(false);
  const [error, setError] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  /* ================= NOTIFICATIONS ================= */
  const [unreadCount, setUnreadCount] = useState(0);

  /* ================= CHALLENGE ================= */
  const [myTotal, setMyTotal] = useState(0);
  const GOAL = 999999;

  const percent = Math.min(
    100,
    Math.round((myTotal / GOAL) * 100)
  );

  /* ================= TELEGRAM USER ================= */
  useEffect(() => {
    try {
      WebApp.ready();

      // Ko'k rang o'rnatish (Telegram header va bottom bar uchun)
      const blueColor = "#1a1a2e"; // Dark blue

      WebApp.setHeaderColor(blueColor);
      WebApp.setBackgroundColor(blueColor);
      document.body.style.backgroundColor = blueColor;

      // Telegram expand qilish
      WebApp.expand();

      const tgUser =
        WebApp?.initDataUnsafe?.user?.username ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;

      const tgUserId =
        WebApp?.initDataUnsafe?.user?.id ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;

      const tgPhoto =
        WebApp?.initDataUnsafe?.user?.photo_url ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;

      if (tgUser) {
        const clean = tgUser.replace("@", "");
        setUsername(clean);
        localStorage.setItem("username", clean);
        setIsTelegram(true);
        if (tgPhoto) setUserPhoto(tgPhoto);
        if (tgUserId) localStorage.setItem("userId", String(tgUserId));
      }
    } catch {
      setIsTelegram(false);
    }
  }, []);

  /* ================= 🚀 COMBINED DASHBOARD INIT — Bitta so'rovda barcha ma'lumot ================= */
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const uid = localStorage.getItem("userId");
        const params = new URLSearchParams();
        if (username) params.append("username", username);
        if (uid) params.append("user_id", uid);

        const res = await apiFetch(`/api/dashboard/init?${params.toString()}`);
        if (!res.ok) {
          throw new Error('API request failed');
        }
        const json = await res.json();

        // Leaderboard
        setLeaderboard(json.leaderboard?.top10 || []);
        setMyRank(json.leaderboard?.me || null);

        // History
        const orders = json.history || [];
        setHistory(orders);

        // Challenge total
        const total = orders
          .filter(o => ["delivered"].includes(o.status))
          .reduce((s, o) => s + Number(o.amount || 0), 0);
        setMyTotal(total);

        // Unread notifications
        setUnreadCount(json.unreadCount || 0);

        console.log(`🚀 Dashboard yuklandi: ${json.loadTime}ms`);

      } catch (err) {
        console.error("Dashboard init error:", err);
        setError("Ma'lumotlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [username]);

  /* ================= REFRESH UNREAD NOTIFICATIONS (30s interval) ================= */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const uid = localStorage.getItem("userId");
        if (!uid) return;
        const res = await apiFetch(`/api/notifications/unread/${uid}`);
        const json = await res.json();
        if (json.success) {
          setUnreadCount(json.unread_count || 0);
        }
      } catch (e) {
        console.error("Unread count error:", e);
      }
    };
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Language confirm function
  const handleLanguageConfirm = () => {
    setLanguage(selectedLanguage);
    setShowLanguageModal(false);
  };

  // Smooth Navigation Handler
  const handleNavClick = (targetTab) => {
    if (tab === targetTab) return;

    // Only show loading for complex tabs (iframes)
    if (targetTab !== 'home') {
       setNavLoading(true);
       setTab(targetTab);

       // Silliq animatsiya uchun delay (white flashni yopish)
       setTimeout(() => {
         setNavLoading(false);
       }, 1500);
    } else {
       // Home is usually fast as it's not an iframe here,
       // but let's give it a small feedback too for consistency or just direct swap
       setTab(targetTab);
    }
  };

  // Back Button Logic
  useEffect(() => {
    const handleBack = () => {
      // Modallar bo'lsa, ularni yopish afzal, lekin bu yerda tabni qaytarish ustuvor
      if (showLanguageModal) {
        setShowLanguageModal(false);
      } else if (tab !== "home") {
        setTab("home");
      }
    };

    try {
      if (tab !== "home" || showLanguageModal) {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(handleBack);
      } else {
        WebApp.BackButton.hide();
        WebApp.BackButton.offClick(handleBack);
      }
    } catch (e) {
      console.log("WebApp BackButton error:", e);
    }

    return () => {
      try {
        WebApp.BackButton.offClick(handleBack);
      } catch (e) {}
    };
  }, [tab, showLanguageModal]);

  /* ================= SPLASH AUTO-HIDE ================= */
  useEffect(() => {
    if (!splashVisible) return;
    const fadeTimer = setTimeout(() => setSplashFading(true), 1250);
    const hideTimer = setTimeout(() => {
      setSplashVisible(false);
      sessionStorage.setItem("splashShown", "1");
    }, 2050);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  /* ================= UI ================= */

  // Splash screen - Premium Send Loader
  if (splashVisible) {
    return (
      <div className={`splash-screen ${splashFading ? 'fade-out' : ''}`}>
        {/* Aura background */}
        <div className="splash-aura"></div>

        <div className="splash-loader">
          {/* Icon with oval rings */}
          <div className="splash-icon-wrap">
            <div className="splash-oval splash-oval-1"></div>
            <div className="splash-oval splash-oval-2"></div>
            <div className="splash-oval splash-oval-3"></div>
            <svg className="splash-star" viewBox="0 0 48 48" width="40" height="40">
              <defs>
                <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ddd6fe"/>
                  <stop offset="50%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#6d28d9"/>
                </linearGradient>
              </defs>
              <path 
                d="M24 4C24 4 26.5 14 30 18C34 22 44 24 44 24C44 24 34 26 30 30C26.5 34 24 44 24 44C24 44 21.5 34 18 30C14 26 4 24 4 24C4 24 14 22 18 18C21.5 14 24 4 24 4Z" 
                fill="url(#splashGradient)"
              />
            </svg>
          </div>

          {/* Brand name */}
          <div className="splash-brand">Premium<em>Send</em></div>

          {/* Loading dots */}
          <div className="splash-dots">
            <div className="splash-dot"></div>
            <div className="splash-dot"></div>
            <div className="splash-dot"></div>
            <div className="splash-dot"></div>
            <div className="splash-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root_dashboard">

      {/* HEADER */}
      <header className="dash-header_dashboard">
        <div className="header-inner_dashboard">
          <div className="brand-title-wrapper_dashboard">
            <div className="brand-profile-container_dashboard">
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  alt="Profile" 
                  className="brand-profile-pic_dashboard" 
                  title={username}
                />
              ) : (
                <div className="brand-profile-default_dashboard">
                  <img 
                    src={profileIcon} 
                    alt="Default Profile" 
                    className="brand-profile-default-icon_dashboard"
                  />
                </div>
              )}
            </div>
            <h1 className="brand-title_dashboard">
              Premium Send
            </h1>
          </div>
          <button
            className="notification-btn-dashboard"
            onClick={() => navigate("/notifications")}
            title="Notifications"
          >
            <img src={bellsIcon} alt="notifications" className="notification-btn-img" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        </div>
      </header>

      <main className="dash-main_dashboard" style={{display: tab === 'home' ? 'flex' : 'none'}}>
        {/* PREMIUM OFFERS */}
        <div className="dashboard-actions-container">
          <div className="premium-offers-grid">
            
            {/* 3 Months */}
            <div className="action-card-offer card-offer-3" onClick={() => navigate("/premium")}>
              <img src={premiumGif} className="offer-img" alt="premium" />
              <div className="offer-details">
                <div className="offer-header-row">
                  <span className="offer-months">3 Oylik</span>
                </div>
                <span className="offer-desc">Standart paket</span>
              </div>
              <div className="offer-price-tag">
                {formatAmount(import.meta.env.VITE_PREMIUM_3)} UZS
              </div>
            </div>

            {/* 6 & 12 Months Wrapper */}
            <div className="offers-row-wrapper-custom">
            
            {/* 6 Months */}
            <div className="action-card-offer card-offer-6" onClick={() => navigate("/premium")}>
              <div className="offer-details">
                <div className="offer-header-row">
                  <span className="offer-months">6 Oylik</span>
                  <span className="offer-discount-badge badge-green">-47%</span>
                </div>
                <span className="offer-desc text-gradient-green">Tavsiya etiladi</span>
              </div>
              <div className="offer-price-tag">
                {formatAmount(import.meta.env.VITE_PREMIUM_6)} UZS
              </div>
            </div>

            {/* 12 Months */}
            <div className="action-card-offer card-offer-12" onClick={() => navigate("/premium")}>
              <div className="offer-details">
                <div className="offer-header-row">
                  <span className="offer-months">1 Yillik</span>
                  <span className="offer-discount-badge badge-premium">-52%</span>
                </div>
                <span className="offer-desc">Eng hamyonbop</span>
              </div>
              <div className="offer-price-tag">
                {formatAmount(import.meta.env.VITE_PREMIUM_12)} UZS
              </div>
            </div>

            </div>

          </div>

          {/* HELP / ADMIN BUTTON */}
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>   
            {/* 1 Month Premium */}
            <a
              href={"https://t.me/premiumsend_admin"}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-contact-btn_dashboard secondary-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 15px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(34,193,195,0.1) 0%, rgba(253,187,45,0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-color)',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              title="Adminga murojaat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
               1 oy <span style={{ color: '#FFC107', fontWeight: 'bold' }}>(akkauntga kirib)</span> - 59,000 UZS
            </a>

            {/* 1 Year Premium */}
            <a
              href={"https://t.me/premiumsend_admin"}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-contact-btn_dashboard secondary-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 15px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(131,58,180,0.1) 0%, rgba(253,29,29,0.1) 50%, rgba(252,176,69,0.1) 100%)',
                border: '1px solid rgba(255,193,7,0.3)',
                color: 'var(--text-color)',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              title="Adminga murojaat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
               1 yil <span style={{ color: '#FFC107', fontWeight: 'bold' }}>(akkauntga kirib)</span> - 320,000 UZS
            </a>
          </div>

        </div>
      </main>
      

      {/* BOTTOM NAVIGATION */}
      <div className="bottom-nav_dashboard">
        <button
          className={`nav-btn_dashboard ${tab === "statistics" ? "active" : ""}`}
          onClick={() => navigate("/statistics")}
          title={t("dashboard.statistics") || "Statistika"}
        >
          <div className="nav-icon">
            <img src={statsIcon} alt="Stats" />
          </div>
        </button>

        <button
          className={`nav-btn_dashboard ${tab === "home" ? "active" : ""}`}
          onClick={() => handleNavClick("home")}
          title={t("dashboard.home")}
        >
          <div className="nav-icon">
            <img src={menuIcon} alt="Home" />
          </div>
        </button>

        <button
          className={`nav-btn_dashboard ${tab === "orders" ? "active" : ""}`}
          onClick={() => navigate("/history")}
          title={t("dashboard.orders") || "Buyurtmalar"}
        >
          <div className="nav-icon">
            <img src={ordersIcon} alt="Orders" />
          </div>
        </button>
      </div>

      {/* NAV LOADING OVERLAY */}
      {navLoading && (
        <div className="nav-loading-overlay">
          <div className="nav-loading-spinner"></div>
          <p className="nav-loading-text">{t("common.loading") || "Yuklanmoqda..."}</p>
        </div>
      )}

      {/* DYNAMIC CONTENT - Only show when not home tab */}
      {tab === "history" && (
        <div className="overlay-modal_dashboard">
          <iframe
            src="/history"
            className="iframe-modal_dashboard"
            title="History"
          ></iframe>
        </div>
      )}



      {tab === "profile" && (
        <div className="overlay-modal_dashboard">
          <iframe
            src="/profile"
            className="iframe-modal_dashboard"
            title="Profile"
          ></iframe>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="language-modal-overlay" onClick={() => setShowLanguageModal(false)}>
          <div className="language-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sticker-wrap">
              <img src={langIcon} alt='lang' className='modal-top-sticker' width={64} height={64} />
            </div>

            <p className="modal-subtitle">{t("common.selectLanguage") || "Tilni tanlang"}</p>

            <div className="language-options">
              <label className={`language-option ${selectedLanguage === 'uz' ? 'selected' : ''}`}>
                <input type="radio" name="language" value="uz" checked={selectedLanguage === 'uz'} onChange={(e) => setSelectedLanguage(e.target.value)} />
                <span className="language-name">O'zbekcha</span>
              </label>
              <label className={`language-option ${selectedLanguage === 'en' ? 'selected' : ''}`}>
                <input type="radio" name="language" value="en" checked={selectedLanguage === 'en'} onChange={(e) => setSelectedLanguage(e.target.value)} />
                <span className="language-name">English</span>
              </label>
              <label className={`language-option ${selectedLanguage === 'ru' ? 'selected' : ''}`}>
                <input type="radio" name="language" value="ru" checked={selectedLanguage === 'ru'} onChange={(e) => setSelectedLanguage(e.target.value)} />
                <span className="language-name">Русский</span>
              </label>
            </div>

            <button className="modal-confirm-btn" onClick={handleLanguageConfirm}>
              {t("common.confirm") || "Tasdiqlash"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

