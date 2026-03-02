import { createContext, useContext, useState, useEffect } from "react";
import uz from "../locales/uz.json";
import en from "../locales/en.json";
import ru from "../locales/ru.json";
import apiFetch from "../utils/apiFetch";

// Translation Context
const LanguageContext = createContext();

// Translation object
const translations = {
  uz,
  en,
  ru,
};

// Provider Component
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // localStorage-dan tilni yuklash, default: uz
    return localStorage.getItem("language") || "uz";
  });

  // Language o'zgarganda localStorage-ga saqlash
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Translation Hook
export function useTranslation() {
  const { language, setLanguage } = useContext(LanguageContext);

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return key; // Key topilmasa, key-ni return qilish
      }
    }

    return value || key;
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    
    // Server'ga tilni saqlash (username mavjud bo'lsa)
    try {
      const username = localStorage.getItem("username");
      if (username) {
        await apiFetch("/api/user/language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, language: newLanguage }),
        });
      }
    } catch (err) {
      console.error("Language save error:", err);
    }
  };

  return { t, language, setLanguage: changeLanguage };
}
