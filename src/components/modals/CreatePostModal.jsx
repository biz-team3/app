import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react";
import { uploadPostMedia } from "../../api/mediaApi.js";
import { createPost } from "../../api/postsApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { extractHashtags } from "../../utils/hashtags.js";
import { evaluateContentSafety } from "../../utils/hiddenWords.js";
import { IMAGE_FILE_ACCEPT, validateImageFiles } from "../../utils/mediaValidation.js";
import { ConfirmDialog } from "./ConfirmDialog.jsx";

export function CreatePostModal({ isOpen, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [caption, setCaption] = useState("");
  const [mediaDrafts, setMediaDrafts] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warningOpen, setWarningOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const activeMedia = mediaDrafts[activeMediaIndex] || mediaDrafts[0];

  const resetDraft = ({ keepPreviews = false } = {}) => {
    if (!keepPreviews) {
      mediaDrafts.forEach((media) => URL.revokeObjectURL(media.previewUrl));
    }
    setCaption("");
    setMediaDrafts([]);
    setActiveMediaIndex(0);
    setStep(1);
    setSubmitting(false);
    setError("");
    setWarningOpen(false);
  };

  const handleClose = () => {
    resetDraft();
    onClose();
  };

  const handleFile = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const validation = validateImageFiles(files);
    if (!validation.ok) {
      setError(t(validation.errorKey, validation.params));
      event.target.value = "";
      return;
    }
    mediaDrafts.forEach((media) => URL.revokeObjectURL(media.previewUrl));
    setMediaDrafts(
      files.map((file) => ({
        type: "IMAGE",
        previewUrl: URL.createObjectURL(file),
        file,
        fileName: file.name,
      })),
    );
    setActiveMediaIndex(0);
    setStep(2);
  };

  const previousMedia = () => {
    setActiveMediaIndex((current) => (current > 0 ? current - 1 : mediaDrafts.length - 1));
  };

  const nextMedia = () => {
    setActiveMediaIndex((current) => (current < mediaDrafts.length - 1 ? current + 1 : 0));
  };

  const handleSubmit = async ({ skipSafety = false } = {}) => {
    if (mediaDrafts.length === 0 || submitting) return;
    const safety = evaluateContentSafety(caption);

    if (!skipSafety && safety.blocked) {
      setError(t("contentBlockedDesc"));
      return;
    }

    if (!skipSafety && safety.warning) {
      setWarningOpen(true);
      return;
    }

    setWarningOpen(false);
    setSubmitting(true);
    setError("");
    try {
      const uploadResult = await uploadPostMedia(mediaDrafts.map((media) => media.file));
      await createPost({
        caption: caption.trim(),
        hashtags: extractHashtags(caption),
        media: uploadResult.media,
      });
      resetDraft();
      onCreated?.();
      onClose();
    } catch {
      setError(t("postSaveFailed"));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[1px]" onMouseDown={handleClose}>
      <div
        className="flex h-[min(760px,92vh)] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid h-12 grid-cols-3 items-center border-b border-gray-200 px-4 dark:border-zinc-800">
          <div>{step > 1 && <button onClick={() => resetDraft()}><ChevronLeft className="h-6 w-6" /></button>}</div>
          <h3 className="text-center text-sm font-bold">{step === 1 ? t("createNewPost") : t("createPost")}</h3>
          <div className="flex justify-end gap-4">
            {step > 1 && <button onClick={handleSubmit} disabled={submitting} className="text-sm font-bold text-blue-500 disabled:text-gray-300">{submitting ? t("saving") : t("share")}</button>}
            <button onClick={handleClose}><X className="h-5 w-5" /></button>
          </div>
        </header>
        {step === 1 ? (
          <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-5 bg-gray-50 text-center dark:bg-zinc-950">
            <div className="rounded-full border border-gray-300 p-5 dark:border-zinc-700">
              <ImageIcon className="h-12 w-12" />
            </div>
            <span className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-bold text-white">{t("selectFromComputer")}</span>
            {error && <p className="max-w-xs text-sm font-semibold text-red-500">{error}</p>}
            <input type="file" accept={IMAGE_FILE_ACCEPT} multiple className="hidden" onChange={handleFile} />
          </label>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="relative flex flex-1 items-center justify-center bg-white dark:bg-zinc-950">
              {mediaDrafts.length > 1 ? (
                <div className="absolute left-4 right-4 top-4 z-10 flex gap-1">
                  {mediaDrafts.map((media, index) => (
                    <button
                      type="button"
                      key={media.previewUrl}
                      onClick={() => setActiveMediaIndex(index)}
                      className="h-1 flex-1 overflow-hidden rounded-full bg-black/20 dark:bg-white/25"
                      aria-label={t("selectPhoto", { index: index + 1 })}
                    >
                      <span className={`block h-full rounded-full ${index <= activeMediaIndex ? "bg-blue-500" : "bg-transparent"}`} />
                    </button>
                  ))}
                </div>
              ) : null}
              <img src={activeMedia?.previewUrl} alt="" className="h-full max-h-full w-full max-w-full object-contain" />
              {mediaDrafts.length > 1 ? (
                <>
                  <button type="button" onClick={previousMedia} className="absolute left-3 top-1/2 rounded-full bg-white/80 p-1.5 shadow-sm hover:bg-white dark:bg-black/45 dark:text-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={nextMedia} className="absolute right-3 top-1/2 rounded-full bg-white/80 p-1.5 shadow-sm hover:bg-white dark:bg-black/45 dark:text-white">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white">
                    {activeMediaIndex + 1} / {mediaDrafts.length}
                  </div>
                </>
              ) : null}
            </div>
            <div className="flex w-full flex-col border-l border-gray-200 dark:border-zinc-800 md:w-[340px]">
              <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-zinc-800">
                <img src={user?.profileImageUrl || "/oosu.hada.jpg"} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm font-bold">{user?.username || "oosu.hada"}</span>
              </div>
              <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder={t("writeCaption")} className="min-h-[220px] flex-1 resize-none bg-transparent p-4 text-sm outline-none" />
              {error && <p className="border-t border-gray-100 px-4 py-3 text-xs font-semibold text-red-500 dark:border-zinc-800">{error}</p>}
            </div>
          </div>
        )}
      </div>
      {warningOpen && (
        <ConfirmDialog
          title={t("contentWarningTitle")}
          description={t("contentWarningDesc")}
          confirmLabel={t("continuePosting")}
          cancelLabel={t("cancel")}
          onConfirm={() => handleSubmit({ skipSafety: true })}
          onCancel={() => setWarningOpen(false)}
        />
      )}
    </div>
  );
}
