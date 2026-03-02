import { useTranslation } from "../context/LanguageContext";
import "./LanguageSelector.css";

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="language-selector">
      <button
        className={`lang-btn ${language === "uz" ? "active" : ""}`}
        onClick={() => setLanguage("uz")}
        title="O'zbekcha"
      >
        🇺🇿 O'z
      </button>
      <button
        className={`lang-btn ${language === "en" ? "active" : ""}`}
        onClick={() => setLanguage("en")}
        title="English"
      >
        🇬🇧 En
      </button>
      <button
        className={`lang-btn ${language === "ru" ? "active" : ""}`}
        onClick={() => setLanguage("ru")}
        title="Русский"
      >
        🇷🇺 Ru
      </button>
    </div>
  );
}
