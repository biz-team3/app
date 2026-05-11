import { useEffect, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { createStory } from "../../api/storiesApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { IMAGE_FILE_ACCEPT, validateImageFiles } from "../../utils/mediaValidation.js";

export function CreateStoryModal({ isOpen, onClose, onCreated }) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const resetDraft = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setSubmitting(false);
    setError("");
  };

  const handleClose = () => {
    resetDraft();
    onClose();
  };

  const handleFile = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validation = validateImageFiles(files, { maxFiles: 1 });
    if (!validation.ok) {
      setError(t(validation.errorKey, validation.params));
      event.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(files[0]);
    setPreviewUrl(URL.createObjectURL(files[0]));
    setError("");
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      await createStory(file);
      resetDraft();
      onCreated?.();
      onClose();
    } catch {
      setError(t("storySaveFailed"));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[1px]" onMouseDown={handleClose}>
      <div
        className="flex h-[min(760px,92vh)] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid h-12 grid-cols-3 items-center border-b border-gray-200 px-4 dark:border-zinc-800">
          <div />
          <h3 className="text-center text-sm font-bold">{t("createStory")}</h3>
          <div className="flex justify-end gap-4">
            {previewUrl && (
              <button onClick={handleSubmit} disabled={submitting} className="text-sm font-bold text-blue-500 disabled:text-gray-300">
                {submitting ? t("saving") : t("share")}
              </button>
            )}
            <button onClick={handleClose} aria-label={t("cancel")}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>
        {previewUrl ? (
          <div className="flex min-h-0 flex-1 flex-col bg-zinc-950">
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <img src={previewUrl} alt="" className="h-full max-h-full w-full max-w-full object-contain" />
            </div>
            {error ? <p className="border-t border-zinc-800 px-4 py-3 text-xs font-semibold text-red-400">{error}</p> : null}
          </div>
        ) : (
          <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-5 bg-gray-50 text-center dark:bg-zinc-950">
            <div className="rounded-full border border-gray-300 p-5 dark:border-zinc-700">
              <ImageIcon className="h-12 w-12" />
            </div>
            <span className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-bold text-white">{t("selectFromComputer")}</span>
            {error && <p className="max-w-xs text-sm font-semibold text-red-500">{error}</p>}
            <input type="file" accept={IMAGE_FILE_ACCEPT} className="hidden" onChange={handleFile} />
          </label>
        )}
      </div>
    </div>
  );
}
