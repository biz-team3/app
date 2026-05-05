import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getPreferences, savePreferences } from "../api/preferencesApi.js";
import { translations } from "../mocks/translations.mock.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("ko");
  const [location, setLocation] = useState("South Korea");

  useEffect(() => {
    getPreferences().then((preferences) => {
      setLanguage(preferences.language || "ko");
      setLocation(preferences.location || "South Korea");
    });
  }, []);

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    savePreferences({ language: nextLanguage });
  };

  const changeLocation = (nextLocation) => {
    const nextLanguage = nextLocation === "South Korea" ? "ko" : "en";
    setLocation(nextLocation);
    setLanguage(nextLanguage);
    savePreferences({ location: nextLocation, language: nextLanguage });
  };

  const t = (key, params = {}) => {
    const template = translations[language]?.[key] || key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? "");
  };

  const value = useMemo(
    () => ({ language, location, setLanguage: changeLanguage, changeLocation, t }),
    [language, location]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
