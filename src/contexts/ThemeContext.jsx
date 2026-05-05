import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getPreferences, savePreferences } from "../api/preferencesApi.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    getPreferences().then((preferences) => {
      const preferred = preferences.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      setTheme(preferred);
    });
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    savePreferences({ theme });
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

