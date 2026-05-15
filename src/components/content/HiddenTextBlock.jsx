import { useState } from "react";
import { Eye } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.js";

export function HiddenTextBlock({ children }) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);

  if (revealed) return children;

  return (
    <HiddenContentNotice onReveal={() => setRevealed(true)} />
  );
}

export function HiddenContentNotice({ onReveal, className = "" }) {
  const { t } = useLanguage();

  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/70 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm dark:bg-zinc-950 dark:text-gray-100">
          <Eye className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800 dark:text-gray-100">{t("hiddenWordsBlockedTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{t("hiddenWordsBlockedDesc")}</p>
          <button
            type="button"
            onClick={onReveal}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Eye className="h-3.5 w-3.5" />
            {t("viewHiddenWordsContent")}
          </button>
        </div>
      </div>
    </div>
  );
}
