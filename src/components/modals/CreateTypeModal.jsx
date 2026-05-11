import { Image, Images, X } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.js";

export function CreateTypeModal({ isOpen, onClose, onPost, onStory }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const selectPost = () => {
    onClose();
    onPost();
  };

  const selectStory = () => {
    onClose();
    onStory();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
      <section
        className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid h-12 grid-cols-3 items-center border-b border-gray-200 px-4 dark:border-zinc-800">
          <div />
          <h3 className="text-center text-sm font-bold">{t("create")}</h3>
          <div className="flex justify-end">
            <button onClick={onClose} aria-label={t("cancel")}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="grid gap-2 p-3">
          <button onClick={selectPost} className="flex items-center gap-3 rounded-xl px-4 py-4 text-left hover:bg-gray-100 dark:hover:bg-zinc-900">
            <Images className="h-6 w-6" />
            <span className="text-sm font-bold">{t("createPost")}</span>
          </button>
          <button onClick={selectStory} className="flex items-center gap-3 rounded-xl px-4 py-4 text-left hover:bg-gray-100 dark:hover:bg-zinc-900">
            <Image className="h-6 w-6" />
            <span className="text-sm font-bold">{t("createStory")}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
