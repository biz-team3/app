import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Trash2, X } from "lucide-react";
import { uploadPostMedia } from "../../api/mediaApi.js";
import { replacePostMedia, updatePostCaption } from "../../api/postsApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { extractHashtags } from "../../utils/hashtags.js";
import { IMAGE_FILE_ACCEPT, validateImageFiles } from "../../utils/mediaValidation.js";

function getMediaUrl(media) {
  return media.previewUrl || media.url;
}

function revokePreviewUrls(mediaItems) {
  mediaItems.forEach((media) => {
    if (media.previewUrl) URL.revokeObjectURL(media.previewUrl);
  });
}

export function PostEditModal({ post, isOpen, onClose, onSaved }) {
  const { t } = useLanguage();
  const [caption, setCaption] = useState("");
  const [mediaDrafts, setMediaDrafts] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaDirty, setMediaDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !post) return;
    setCaption(post.caption || "");
    setMediaDrafts(post.media || []);
    setActiveMediaIndex(0);
    setMediaDirty(false);
    setSaving(false);
    setError("");
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const activeMedia = mediaDrafts[activeMediaIndex] || mediaDrafts[0];
  const canSave = caption.trim().length > 0 && mediaDrafts.length > 0;

  const handleFile = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const validation = validateImageFiles(files);
    if (!validation.ok) {
      setError(t(validation.errorKey, validation.params));
      event.target.value = "";
      return;
    }
    revokePreviewUrls(mediaDrafts);
    setMediaDrafts(
      files.map((file) => ({
        type: "IMAGE",
        previewUrl: URL.createObjectURL(file),
        file,
        fileName: file.name,
      })),
    );
    setActiveMediaIndex(0);
    setMediaDirty(true);
    event.target.value = "";
  };

  const handleClose = () => {
    revokePreviewUrls(mediaDrafts);
    onClose();
  };

  const previousMedia = () => {
    setActiveMediaIndex((current) => (current > 0 ? current - 1 : mediaDrafts.length - 1));
  };

  const nextMedia = () => {
    setActiveMediaIndex((current) => (current < mediaDrafts.length - 1 ? current + 1 : 0));
  };

  const moveSelectedMedia = (direction) => {
    const nextIndex = activeMediaIndex + direction;
    if (nextIndex < 0 || nextIndex >= mediaDrafts.length) return;
    setMediaDrafts((current) => {
      const next = [...current];
      [next[activeMediaIndex], next[nextIndex]] = [next[nextIndex], next[activeMediaIndex]];
      return next;
    });
    setActiveMediaIndex(nextIndex);
    setMediaDirty(true);
  };

  const removeSelectedMedia = () => {
    if (!activeMedia || mediaDrafts.length <= 1) return;
    if (activeMedia.previewUrl) URL.revokeObjectURL(activeMedia.previewUrl);
    setMediaDrafts((current) => current.filter((_, index) => index !== activeMediaIndex));
    setActiveMediaIndex((current) => Math.max(0, Math.min(current, mediaDrafts.length - 2)));
    setMediaDirty(true);
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      await updatePostCaption(post.postId, {
        caption: caption.trim(),
        hashtags: extractHashtags(caption),
      });

      if (mediaDirty) {
        const hasNewFiles = mediaDrafts.some((media) => media.file);
        if (hasNewFiles) {
          const uploadResult = await uploadPostMedia(mediaDrafts.map((media) => media.file).filter(Boolean));
          await replacePostMedia(post.postId, { media: uploadResult.media });
        } else {
          await replacePostMedia(post.postId, { media: mediaDrafts });
        }
      }

      onSaved?.();
      handleClose();
    } catch {
      setError(t("postSaveFailed"));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]" onMouseDown={handleClose}>
      <section
        className="flex h-[min(760px,92vh)] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid h-12 grid-cols-3 items-center border-b border-gray-200 px-4 dark:border-zinc-800">
          <div />
          <h2 className="text-center text-sm font-bold">{t("editPost")}</h2>
          <div className="flex items-center justify-end gap-4">
            <button onClick={handleSave} disabled={!canSave || saving} className="text-sm font-bold text-blue-500 disabled:text-gray-300">
              {saving ? t("saving") : t("save")}
            </button>
            <button onClick={handleClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-zinc-900">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="relative flex flex-1 items-center justify-center bg-white dark:bg-zinc-950">
            {activeMedia ? <img src={getMediaUrl(activeMedia)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-12 w-12 text-gray-300" />}
            {mediaDrafts.length > 1 ? (
              <>
                <button type="button" onClick={previousMedia} className="absolute left-3 top-1/2 rounded-full bg-white/80 p-1.5 shadow-sm hover:bg-white">
                  <ChevronLeft className="h-5 w-5 text-black" />
                </button>
                <button type="button" onClick={nextMedia} className="absolute right-3 top-1/2 rounded-full bg-white/80 p-1.5 shadow-sm hover:bg-white">
                  <ChevronRight className="h-5 w-5 text-black" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white">
                  {activeMediaIndex + 1} / {mediaDrafts.length}
                </div>
              </>
            ) : null}
          </div>

          <aside className="flex w-full flex-col border-l border-gray-200 dark:border-zinc-800 md:w-[360px]">
            <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-zinc-800">
              <img src={post.author.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-sm font-bold">{post.author.username}</span>
            </div>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder={t("writeCaption")}
              className="min-h-[220px] resize-none bg-transparent p-4 text-sm leading-relaxed outline-none"
            />
            <div className="mt-auto border-t border-gray-100 p-4 dark:border-zinc-800">
              {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 dark:bg-red-950/30">{error}</p>}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">{t("postPhotos")}</span>
                <label className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                  {t("changePhotos")}
                  <input type="file" accept={IMAGE_FILE_ACCEPT} multiple className="hidden" onChange={handleFile} />
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {mediaDrafts.map((media, index) => (
                  <button
                    type="button"
                    key={`${getMediaUrl(media)}-${index}`}
                    onClick={() => setActiveMediaIndex(index)}
                    className={`aspect-square overflow-hidden rounded-lg border ${index === activeMediaIndex ? "border-blue-500" : "border-transparent"}`}
                    aria-label={t("selectPhoto", { index: index + 1 })}
                  >
                    <img src={getMediaUrl(media)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              {mediaDrafts.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => moveSelectedMedia(-1)}
                    disabled={activeMediaIndex === 0}
                    className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-2 py-2 text-xs font-bold disabled:text-gray-300 dark:bg-zinc-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("moveEarlier")}
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSelectedMedia(1)}
                    disabled={activeMediaIndex === mediaDrafts.length - 1}
                    className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-2 py-2 text-xs font-bold disabled:text-gray-300 dark:bg-zinc-900"
                  >
                    {t("moveLater")}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={removeSelectedMedia}
                    disabled={mediaDrafts.length <= 1}
                    className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-2 text-xs font-bold text-red-500 disabled:text-red-200 dark:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("removePhoto")}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
