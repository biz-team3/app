import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { deleteStory } from "../../api/storiesApi.js";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";
import { formatRelativeTime } from "../../utils/format.js";

export function StoryViewer({ groups, initialIndex = 0, onClose, onDeleted }) {
  const { t } = useLanguage();
  const [groupIndex, setGroupIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [deletingStory, setDeletingStory] = useState(null);
  const [actionError, setActionError] = useState("");

  const group = groups[groupIndex];
  const story = group?.stories?.[storyIndex];
  const canGoPrevious = storyIndex > 0 || groupIndex > 0;

  useEffect(() => {
    setStoryIndex(0);
  }, [groupIndex]);

  useEffect(() => {
    if (deletingStory) return undefined;
    const timer = window.setTimeout(() => nextStory(), 5000);
    return () => window.clearTimeout(timer);
  });

  const nextStory = () => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((value) => value + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((value) => value + 1);
    } else {
      onClose();
    }
  };

  const previousStory = () => {
    if (storyIndex > 0) setStoryIndex((value) => value - 1);
    else if (groupIndex > 0) setGroupIndex((value) => value - 1);
  };

  const handleDeleteStory = async () => {
    if (!deletingStory) return;
    setActionError("");

    try {
      await deleteStory(deletingStory.storyId);
      setDeletingStory(null);
      onDeleted?.();
      onClose();
    } catch {
      setDeletingStory(null);
      setActionError(t("storyActionFailed"));
    }
  };

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black" onMouseDown={onClose}>
      {group.isOwner && (
        <button
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => setDeletingStory(story)}
          className="absolute right-16 top-5 z-10 text-white"
          aria-label={t("delete")}
        >
          <Trash2 className="h-7 w-7" />
        </button>
      )}
      <button onClick={onClose} className="absolute right-5 top-5 z-10 text-white">
        <X className="h-8 w-8" />
      </button>
      <div
        className="relative h-full w-full max-w-[430px] overflow-hidden bg-zinc-950 md:h-[92vh] md:rounded-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 z-10 p-4">
          <div className="mb-3 flex gap-1">
            {group.stories.map((item, index) => (
              <div key={item.storyId} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <div className={`h-full bg-white ${index === storyIndex ? "animate-storyProgress" : index < storyIndex ? "w-full" : "w-0"}`} />
              </div>
            ))}
          </div>
          <Link to={`/profile/${group.username}`} onClick={onClose} className="flex w-fit items-center gap-3 text-white">
            <img src={group.profileImageUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            <span className="text-sm font-bold">{group.username}</span>
            <span className="text-xs text-white/70">{formatRelativeTime(story.createdAt)}</span>
          </Link>
        </div>
        <img src={story.imageUrl} alt="" className="h-full w-full object-cover" />
        {actionError ? <p className="absolute bottom-14 left-4 right-4 rounded-lg bg-red-500/90 px-3 py-2 text-center text-xs font-semibold text-white">{actionError}</p> : null}
        <button
          onClick={previousStory}
          disabled={!canGoPrevious}
          className={`absolute left-2 top-1/2 rounded-full bg-black/30 p-2 text-white ${canGoPrevious ? "opacity-100" : "pointer-events-none opacity-25"}`}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button onClick={nextStory} className="absolute right-2 top-1/2 rounded-full bg-black/30 p-2 text-white">
          <ChevronRight className="h-6 w-6" />
        </button>
        <div className="absolute bottom-4 left-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white -translate-x-1/2">
          {storyIndex + 1} / {group.stories.length}
        </div>
      </div>
      {deletingStory && (
        <ConfirmDialog
          title={t("deleteStoryTitle")}
          description={t("deleteStoryDesc")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          destructive
          onConfirm={handleDeleteStory}
          onCancel={() => setDeletingStory(null)}
        />
      )}
    </div>
  );
}
