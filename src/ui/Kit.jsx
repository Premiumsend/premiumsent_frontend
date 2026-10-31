import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { useTranslation } from "../context/LanguageContext";
import { CheckIcon, ChevronDown, ChevronRight, HomeIcon, OrdersIcon, ProfileIcon, SupportIcon, TagIcon, ChannelIcon } from "./Brand";
import { SUPPORT_TELEGRAM_URL, SUPPORT_TELEGRAM_USERNAME } from "../utils/supportContact";
import { useGo } from "./nav";
import "./pn.css";

export const fmt = (n) => Number(n || 0).toLocaleString("ru-RU").replace(/ /g, " ");

// Matndagi {belgi}larni to'ldiradi
export const fill = (text, vars) => Object.entries(vars).reduce((out, [k, v]) => out.split(`{${k}}`).join(v), text);

const DATE_LOCALES = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };
export const dateLocale = (language) => DATE_LOCALES[language] || "uz-UZ";

export function openLink(url) {
  try {
    if (url.startsWith("https://t.me/")) WebApp.openTelegramLink(url);
    else WebApp.openLink(url);
  } catch {
    window.open(url, "_blank");
  }
}

export const openSupport = () => openLink(SUPPORT_TELEGRAM_URL);

// Yopilish animatsiyasi tugagach onClose chaqiriladi
export function useClosing(onClose, ms = 180) {
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, ms);
  };
  return [closing, close];
}

// Har bir sahifa shu ichida: ekranni to'ldiradi, ichki qatlamlar shunga nisbatan joylashadi
export function Shell({ children }) {
  return <div className="pn-root" data-pn="cobalt"><div className="pn-stage">{children}</div></div>;
}

export const Dust = () => [1, 2, 3, 4, 5].map((n) => <i key={n} className={`pn-dust pn-dust--${n}`} aria-hidden="true" />);

export function Tabs({ active }) {
  const go = useGo();
  const { t } = useTranslation();

  // Pastki menyu sahifalarida orqaga tugmasi kerak emas
  useEffect(() => {
    try { WebApp.BackButton.hide(); } catch { /* Telegram tashqarisi */ }
  }, []);

  const items = [
    ["home", "/", HomeIcon, t("dashboard.home") || "Asosiy"],
    ["orders", "/history", OrdersIcon, t("ui.orders")],
    ["profile", "/profile", ProfileIcon, t("dashboard.profile") || "Profil"],
  ];
  return (
    <nav className="pn-tabs" aria-label="Menu">
      {items.map(([id, path, Icon, label], i) => (
        <button
          key={id}
          type="button"
          className={active === id ? "is-active" : ""}
          onClick={() => active !== id && go(path, i > items.findIndex((x) => x[0] === active) ? "tab-next" : "tab-prev")}
          aria-label={label}
        >
          <Icon size={22} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// Modal ekran o'rtasida chiqadi va faqat X bilan yopiladi
export function Modal({ title, onClose, children }) {
  const { t } = useTranslation();
  const [closing, close] = useClosing(onClose);
  return (
    <div className={`pn-modal ${closing ? "is-closing" : ""}`}>
      <div className="pn-modal__panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pn-modal__head">
          <h2>{title}</h2>
          <button type="button" className="pn-modal__x" onClick={close} aria-label={t("ui.close")}>✕</button>
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

const ADS = [1, 2, 3];

export function Ads() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ADS.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pn-ad">
      <div className="pn-ad__track" style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}>
        {ADS.map((n) => (
          <div key={n} className="pn-ad__slide">
            <span className="pn-ad__ic"><ChannelIcon size={19} /></span>
            <span className="pn-ad__text"><b>{t(`ui.ad${n}t`)}</b><span>{t(`ui.ad${n}d`)}</span></span>
          </div>
        ))}
      </div>
      <span className="pn-ad__dots" aria-hidden="true">{ADS.map((n, i) => <i key={n} className={i === index ? "is-active" : ""} />)}</span>
    </div>
  );
}

export function SupportCard() {
  const { t } = useTranslation();
  return (
    <button type="button" className="pn-row-card" onClick={openSupport}>
      <span className="pn-row-card__ic"><SupportIcon size={20} /></span>
      <span className="pn-row-card__text"><b>{t("ui.support")}</b><span>@{SUPPORT_TELEGRAM_USERNAME}</span></span>
      <ChevronRight size={18} />
    </button>
  );
}

export function RecipientField({ username, setUsername, onMe, loading, error, profile }) {
  const { t } = useTranslation();
  return (
    <section className="pn-field">
      <label htmlFor="pn-username">{t("ui.whoTo")}</label>
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
        {window?.Telegram?.WebApp && <button type="button" onClick={onMe}>{t("ui.me")}</button>}
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <section className="pn-promo">
      <button type="button" className="pn-promo__toggle" onClick={() => setOpen((o) => !o)}>
        <TagIcon size={18} /> {t("ui.promo")} <ChevronDown size={17} className={open ? "is-open" : ""} />
      </button>
      {open && (
        <div className="pn-promo__row">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("ui.promoCode")} autoCapitalize="characters" />
          <button type="button" disabled={!code} onClick={onApply}>{t("ui.apply")}</button>
        </div>
      )}
      {message && <p className={isError ? "pn-error" : "pn-promo__ok"}>{!isError && applied && <CheckIcon size={15} />}{message}</p>}
    </section>
  );
}
