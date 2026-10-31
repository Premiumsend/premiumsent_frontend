import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { useTranslation } from "../context/LanguageContext";
import { CheckIcon, ChevronDown, ChevronRight, HomeIcon, OrdersIcon, ProfileIcon, SupportIcon, TagIcon, ChannelIcon } from "./Brand";
import { SUPPORT_TELEGRAM_URL, SUPPORT_TELEGRAM_USERNAME } from "../utils/supportContact";
import "./pn.css";

export const fmt = (n) => Number(n || 0).toLocaleString("ru-RU").replace(/ /g, " ");

export function openLink(url) {
  try {
    if (url.startsWith("https://t.me/")) WebApp.openTelegramLink(url);
    else WebApp.openLink(url);
  } catch {
    window.open(url, "_blank");
  }
}

export const openSupport = () => openLink(SUPPORT_TELEGRAM_URL);

// Har bir sahifa shu ichida: ekranni to'ldiradi, ichki qatlamlar shunga nisbatan joylashadi
export function Shell({ children }) {
  return <div className="pn-root" data-pn="cobalt"><div className="pn-stage">{children}</div></div>;
}

export const Dust = () => [1, 2, 3, 4, 5].map((n) => <i key={n} className={`pn-dust pn-dust--${n}`} aria-hidden="true" />);

export function Tabs({ active }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Pastki menyu sahifalarida orqaga tugmasi kerak emas
  useEffect(() => {
    try { WebApp.BackButton.hide(); } catch { /* Telegram tashqarisi */ }
  }, []);

  const items = [
    ["home", "/", HomeIcon, t("dashboard.home") || "Asosiy"],
    ["orders", "/history", OrdersIcon, "Buyurtmalar"],
    ["profile", "/profile", ProfileIcon, t("dashboard.profile") || "Profil"],
  ];
  return (
    <nav className="pn-tabs" aria-label="Menu">
      {items.map(([id, path, Icon, label]) => (
        <button key={id} type="button" className={active === id ? "is-active" : ""} onClick={() => active !== id && navigate(path)} aria-label={label}>
          <Icon size={22} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// Modal ekran o'rtasida chiqadi va faqat X bilan yopiladi
export function Modal({ title, onClose, children }) {
  return (
    <div className="pn-modal">
      <div className="pn-modal__panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pn-modal__head">
          <h2>{title}</h2>
          <button type="button" className="pn-modal__x" onClick={onClose} aria-label="Yopish">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const LANGS = [["uz", "🇺🇿", "O'zbekcha"], ["ru", "🇷🇺", "Русский"], ["en", "🇬🇧", "English"]];

export function LanguageModal({ onClose }) {
  const { t, language, setLanguage } = useTranslation();
  return (
    <Modal title={t("common.selectLanguage") || "Tilni tanlang"} onClose={onClose}>
      <div className="pn-langs">
        {LANGS.map(([code, flag, label]) => (
          <button key={code} type="button" className={language === code ? "is-active" : ""} aria-pressed={language === code} onClick={() => language !== code && setLanguage(code)}>
            <span>{flag}</span><b>{label}</b>{language === code && <CheckIcon size={18} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}

const ADS = [
  { title: "Premium to'g'ridan-to'g'ri", text: "Profilingizga kirmasdan yuboramiz" },
  { title: "Do'stingizga Premium yuboring", text: "Username kiritish kifoya" },
  { title: "Yordam kerakmi?", text: "Yordam Markazi har doim aloqada" },
];

export function Ads() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ADS.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pn-ad">
      <div className="pn-ad__track" style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}>
        {ADS.map((ad) => (
          <div key={ad.title} className="pn-ad__slide">
            <span className="pn-ad__ic"><ChannelIcon size={19} /></span>
            <span className="pn-ad__text"><b>{ad.title}</b><span>{ad.text}</span></span>
          </div>
        ))}
      </div>
      <span className="pn-ad__dots" aria-hidden="true">{ADS.map((ad, i) => <i key={ad.title} className={i === index ? "is-active" : ""} />)}</span>
    </div>
  );
}

export function SupportCard() {
  return (
    <button type="button" className="pn-row-card" onClick={openSupport}>
      <span className="pn-row-card__ic"><SupportIcon size={20} /></span>
      <span className="pn-row-card__text"><b>Yordam Markazi</b><span>@{SUPPORT_TELEGRAM_USERNAME}</span></span>
      <ChevronRight size={18} />
    </button>
  );
}

export function RecipientField({ username, setUsername, onMe, loading, error, profile }) {
  return (
    <section className="pn-field">
      <label htmlFor="pn-username">Kimga yuboramiz?</label>
      <div className="pn-input">
        <span>@</span>
        <input
          id="pn-username"
          value={username.replace(/^@/, "")}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        {window?.Telegram?.WebApp && <button type="button" onClick={onMe}>O'zim</button>}
      </div>
      {loading && <div className="pn-spin" />}
      {error && <p className="pn-error">{error}</p>}
      {profile && (
        <div className="pn-recipient">
          {profile.imageUrl
            ? <img className="pn-avatar" src={profile.imageUrl} alt="" />
            : <span className="pn-avatar">{(profile.fullName || profile.username || "?").charAt(0).toUpperCase()}</span>}
          <span><b>{profile.fullName || `@${profile.username}`}</b>@{profile.username}</span>
          <i><CheckIcon size={16} /></i>
        </div>
      )}
    </section>
  );
}

export function PromoField({ code, setCode, message, isError, applied, onApply }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="pn-promo">
      <button type="button" className="pn-promo__toggle" onClick={() => setOpen((o) => !o)}>
        <TagIcon size={18} /> Promokod <ChevronDown size={17} className={open ? "is-open" : ""} />
      </button>
      {open && (
        <div className="pn-promo__row">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kod" autoCapitalize="characters" />
          <button type="button" disabled={!code} onClick={onApply}>Qo'llash</button>
        </div>
      )}
      {message && <p className={isError ? "pn-error" : "pn-promo__ok"}>{!isError && applied && <CheckIcon size={15} />}{message}</p>}
    </section>
  );
}
