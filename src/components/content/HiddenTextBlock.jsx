import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage.js";

export function HiddenTextBlock({ children }) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);

  if (revealed) return children;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/70">
      <p className="font-bold text-gray-700 dark:text-gray-200">{t("hiddenWordsBlockedTitle")}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{t("hiddenWordsBlockedDesc")}</p>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-600"
      >
        {t("viewHiddenWordsContent")}
      </button>
    </div>
  );
}
