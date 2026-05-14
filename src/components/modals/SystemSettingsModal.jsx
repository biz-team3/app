import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getPreferences, savePreferences } from "../../api/preferencesApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { useTheme } from "../../hooks/useTheme.js";

const languageOptions = [
  { value: "ko", labelKey: "korean" },
  { value: "en", labelKey: "english" },
];

const themeOptions = [
  { value: "light", labelKey: "lightMode" },
  { value: "dark", labelKey: "darkMode" },
];

export function SystemSettingsModal({ isOpen, onClose }) {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [hiddenWordsEnabled, setHiddenWordsEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    getPreferences().then((preferences) => {
      setHiddenWordsEnabled(Boolean(preferences.hiddenWordsEnabled));
    });
  }, [isOpen]);

  const changeHiddenWordsEnabled = (nextValue) => {
    setHiddenWordsEnabled(nextValue);
    savePreferences({ hiddenWordsEnabled: nextValue });
    window.dispatchEvent(new Event("preferences:changed"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
      <section
        className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid h-12 grid-cols-3 items-center border-b border-gray-200 px-4 dark:border-zinc-800">
          <div />
          <h2 className="text-center text-sm font-bold">{t("settings")}</h2>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-zinc-900" aria-label={t("close")}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          <SettingGroup title={t("language")}>
            <SegmentedControl
              options={languageOptions}
              value={language}
              onChange={setLanguage}
              t={t}
            />
          </SettingGroup>
          <SettingGroup title={t("displayMode")}>
            <SegmentedControl
              options={themeOptions}
              value={theme}
              onChange={setTheme}
              t={t}
            />
          </SettingGroup>
          <SettingGroup title={t("hiddenWords")}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t("hiddenWordsDesc")}</p>
              <button
                type="button"
                onClick={() => changeHiddenWordsEnabled(!hiddenWordsEnabled)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  hiddenWordsEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-zinc-700"
                }`}
                aria-pressed={hiddenWordsEnabled}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    hiddenWordsEnabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </SettingGroup>
        </div>
      </section>
    </div>
  );
}

function SettingGroup({ title, children }) {
  return (
    <section className="px-5 py-4">
      <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      {children}
    </section>
  );
}

function SegmentedControl({ options, value, onChange, t }) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-zinc-900">
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
              selected
                ? "bg-white text-gray-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
