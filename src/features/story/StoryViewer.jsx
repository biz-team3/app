import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { deleteStory, markStoryAsRead } from "../../api/storiesApi.js";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";
import { formatRelativeTime } from "../../utils/format.js";

const STORY_DURATION_MS = 5000;
const STORY_READ_DELAY_MS = STORY_DURATION_MS / 2;

function markStoryReadInGroups(groups, storyId) {
  return groups.map((group) => ({
    ...group,
    stories: (group.stories || []).map((story) => (story.storyId === storyId ? { ...story, isRead: true } : story)),
  }));
}

function getFirstUnreadStoryIndex(group) {
  const unreadIndex = (group?.stories || []).findIndex((story) => !story.isRead);
  return unreadIndex >= 0 ? unreadIndex : 0;
}

export function StoryViewer({ groups, initialIndex = 0, onClose, onDeleted, onViewed }) {
  const { t } = useLanguage();
  const [localGroups, setLocalGroups] = useState(groups);
  const [position, setPosition] = useState({
    groupIndex: initialIndex,
    storyIndex: getFirstUnreadStoryIndex(groups[initialIndex]),
  });
  const [deletingStory, setDeletingStory] = useState(null);
  const [actionError, setActionError] = useState("");
  const readRequestedStoryIdsRef = useRef(new Set());

  const groupIndex = position.groupIndex;
  const storyIndex = position.storyIndex;
  const group = localGroups[groupIndex];
  const story = group?.stories?.[storyIndex];
  const canGoPrevious = storyIndex > 0 || groupIndex > 0;

  useEffect(() => {
    const nextGroupIndex = Math.max(0, Math.min(initialIndex, groups.length - 1));
    setLocalGroups(groups);
    readRequestedStoryIdsRef.current = new Set(
      groups.flatMap((item) => (item.stories || []).filter((storyItem) => storyItem.isRead).map((storyItem) => storyItem.storyId)),
    );
    setPosition({
      groupIndex: nextGroupIndex,
      storyIndex: getFirstUnreadStoryIndex(groups[nextGroupIndex]),
    });
  }, [groups, initialIndex]);

  const markVisibleStoryAsRead = (targetStory = story) => {
    if (!targetStory || targetStory.isRead || readRequestedStoryIdsRef.current.has(targetStory.storyId)) return;
    readRequestedStoryIdsRef.current.add(targetStory.storyId);
    setLocalGroups((current) => markStoryReadInGroups(current, targetStory.storyId));
    markStoryAsRead(targetStory.storyId).catch(() => {});
  };

  useEffect(() => {
    if (!story || story.isRead) return undefined;
    const readTimer = window.setTimeout(() => {
      markVisibleStoryAsRead(story);
    }, STORY_READ_DELAY_MS);
    return () => window.clearTimeout(readTimer);
  }, [story?.storyId, story?.isRead]);

  const handleClose = () => {
    onViewed?.();
    onClose();
  };

  const nextStory = () => {
    if (!group) return;
    markVisibleStoryAsRead(story);
    if (storyIndex < group.stories.length - 1) {
      setPosition({ groupIndex, storyIndex: storyIndex + 1 });
    } else if (groupIndex < localGroups.length - 1) {
      const nextGroupIndex = groupIndex + 1;
      setPosition({
        groupIndex: nextGroupIndex,
        storyIndex: getFirstUnreadStoryIndex(localGroups[nextGroupIndex]),
      });
    } else {
      handleClose();
    }
  };

  useEffect(() => {
    if (!story) return undefined;
    if (deletingStory) return undefined;
    const timer = window.setTimeout(() => nextStory(), STORY_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [story?.storyId, deletingStory]);

  const previousStory = () => {
    markVisibleStoryAsRead(story);
    if (storyIndex > 0) {
      setPosition({ groupIndex, storyIndex: storyIndex - 1 });
    } else if (groupIndex > 0) {
      const previousGroup = localGroups[groupIndex - 1];
      setPosition({
        groupIndex: groupIndex - 1,
        storyIndex: Math.max(0, (previousGroup?.stories?.length || 1) - 1),
      });
    }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black" onMouseDown={handleClose}>
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
      <button onClick={handleClose} className="absolute right-5 top-5 z-10 text-white">
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
          <Link to={`/profile/${group.username}`} onClick={handleClose} className="flex w-fit items-center gap-3 text-white">
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
