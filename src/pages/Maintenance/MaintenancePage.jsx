import React, { useState, useEffect } from "react";
import "./Maintenance.css";

export default function MaintenancePage() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-page">
      {/* Background particles */}
      <div className="mt-page__particles">
        <div className="mt-particle mt-particle--1"></div>
        <div className="mt-particle mt-particle--2"></div>
        <div className="mt-particle mt-particle--3"></div>
        <div className="mt-particle mt-particle--4"></div>
        <div className="mt-particle mt-particle--5"></div>
      </div>

      <div className="mt-page__card">
        {/* Brand */}
        <div className="mt-page__brand">
          <span className="mt-page__brand-icon">⭐</span>
          <span className="mt-page__brand-name">Premium Send</span>
        </div>

        {/* Animated icon */}
        <div className="mt-page__icon">
          <div className="mt-page__ring"></div>
          <div className="mt-page__ring mt-page__ring--2"></div>
          <span className="mt-page__gear">⚙️</span>
        </div>

        <h1 className="mt-page__title">
          Texnik ishlar olib borilmoqda
        </h1>

        <p className="mt-page__desc">
          Saytda muhim yangilanishlar amalga oshirilmoqda{dots}
          <br/>
          Iltimos, biroz kuting.
        </p>

        {/* Animated progress */}
        <div className="mt-page__progress">
          <div className="mt-page__progress-glow"></div>
        </div>

        {/* Estimated time */}
        <div className="mt-page__eta">
          <span className="mt-page__eta-icon">⏳</span>
          <span>Tez orada qaytamiz</span>
        </div>

        {/* News channel */}
        <a
          href="https://t.me/premiumsenduz"
          className="mt-page__channel"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="mt-page__channel-icon">📢</span>
          <div className="mt-page__channel-info">
            <span className="mt-page__channel-name">@premiumsenduz — Yangiliklar</span>
            <span className="mt-page__channel-hint">Bot ishga tushganini birinchi bo'lib biling</span>
          </div>
          <span className="mt-page__channel-arrow">→</span>
        </a>

        {/* Action buttons */}
        <div className="mt-page__actions">
          <a
            href="https://t.me/PremiumSend_jbot"
            className="mt-page__btn mt-page__btn--primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            📩 Qo'llab-quvvatlash
          </a>
          <button
            className="mt-page__btn mt-page__btn--ghost"
            onClick={() => window.location.reload()}
          >
            🔄 Qayta tekshirish
          </button>
        </div>

        <p className="mt-page__footer">
          @premiumsenduz · Telegram Premium xizmati
        </p>
      </div>
    </div>
  );
}
