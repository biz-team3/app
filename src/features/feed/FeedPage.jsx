import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getFeedPosts } from "../../api/postsApi.js";
import { getFeedStories, getStoryBundle } from "../../api/storiesApi.js";
import { StoryViewer } from "../story/StoryViewer.jsx";
import { PostCard } from "../post/PostCard.jsx";
import { PostDetailModal } from "../post/PostDetailModal.jsx";
import { PostEditModal } from "../../components/modals/PostEditModal.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";

const STORY_MIN_TILE_WIDTH = 62;
const STORY_TILE_GAP = 12;
const STORY_NAV_NUDGE_SPACE = 12;
const FEED_MAX_WIDTH = 600;
const FEED_HORIZONTAL_PADDING = 16;
const STORY_RAIL_HORIZONTAL_PADDING = 16;
const STORY_MIN_VISIBLE_COUNT = 5;
const STORY_MAX_VISIBLE_COUNT = 6;
const STORY_MIN_AVATAR_SIZE = 28;
const STORY_MAX_AVATAR_SIZE = 64;
const DEFAULT_STORY_LAYOUT = {
  visibleCount: STORY_MIN_VISIBLE_COUNT,
  tileWidth: 52,
  avatarSize: 42,
  navNudgeSpace: 0,
};

function hasStories(group) {
  return (group?.stories || []).length > 0;
}

function getStoryLayoutForViewport(totalStories = 0) {
  if (typeof window === "undefined") return DEFAULT_STORY_LAYOUT;

  const feedWidth = Math.min(FEED_MAX_WIDTH, window.innerWidth - FEED_HORIZONTAL_PADDING);
  const railWidth = feedWidth - STORY_RAIL_HORIZONTAL_PADDING;
  if (!Number.isFinite(railWidth) || railWidth <= 0) return DEFAULT_STORY_LAYOUT;

  const countForWidth = (width) =>
    Math.min(
      STORY_MAX_VISIBLE_COUNT,
      Math.max(STORY_MIN_VISIBLE_COUNT, Math.floor((width + STORY_TILE_GAP) / (STORY_MIN_TILE_WIDTH + STORY_TILE_GAP))),
    );
  const countWithoutNudge = countForWidth(railWidth);
  const navNudgeSpace = totalStories > countWithoutNudge ? STORY_NAV_NUDGE_SPACE : 0;
  const availableWidth = railWidth - navNudgeSpace * 2;
  const visibleCount = countForWidth(availableWidth);
  const tileWidth = (availableWidth - STORY_TILE_GAP * (visibleCount - 1)) / visibleCount;
  const avatarSize = Math.max(STORY_MIN_AVATAR_SIZE, Math.min(STORY_MAX_AVATAR_SIZE, tileWidth - 10));

  return { visibleCount, tileWidth, avatarSize, navNudgeSpace };
}

function hasUnreadStories(group) {
  return (group?.stories || []).some((story) => !story.isRead);
}

function getStoryRingClass(group) {
  if (!hasStories(group)) return "bg-gray-200 dark:bg-gray-800";
  return hasUnreadStories(group) ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : "bg-gray-300 dark:bg-gray-700";
}

function toViewerStoryGroup(user) {
  return {
    userId: user.userId,
    username: user.username,
    profileImageUrl: user.profileImageUrl || user.profileImg || "",
    isOwner: true,
    stories: [],
  };
}

function mergeStoryGroups(myStoryGroup, feedStoryGroups) {
  const seen = new Set();
  const groups = [];

  if (myStoryGroup) {
    groups.push({ ...myStoryGroup, isOwner: true });
    seen.add(myStoryGroup.userId);
  }

  (feedStoryGroups || []).forEach((group) => {
    if (!hasStories(group) || seen.has(group.userId)) return;
    groups.push({ ...group, isOwner: false });
    seen.add(group.userId);
  });

  return groups;
}

export function FeedPage() {
  const { feedVersion, onCreateStory } = useOutletContext();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [storyPage, setStoryPage] = useState(0);
  const [storyLayout, setStoryLayout] = useState(DEFAULT_STORY_LAYOUT);
  const [viewerUserId, setViewerUserId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const loadStories = useCallback(async () => {
    if (!user?.userId) {
      setStoryGroups([]);
      setStoryPage(0);
      return;
    }

    const [myStoryGroupResult, feedStoriesResult] = await Promise.allSettled([
      getStoryBundle(user.userId),
      getFeedStories(),
    ]);

    const myStoryGroup =
      myStoryGroupResult.status === "fulfilled" ? { ...myStoryGroupResult.value, isOwner: true } : toViewerStoryGroup(user);
    const feedStoryGroups = feedStoriesResult.status === "fulfilled" ? feedStoriesResult.value.content : [];

    setStoryGroups(mergeStoryGroups(myStoryGroup, feedStoryGroups));
    setStoryPage(0);
  }, [user]);

  const loadFeedPage = useCallback(async (targetPage = 0, mode = "replace") => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const feed = await getFeedPosts({ page: targetPage, size: 10 });
      setPosts((current) => (mode === "append" ? [...current, ...feed.content] : feed.content));
      setPage(feed.pageRequest.page);
      setHasNext(feed.hasNext);
    } catch {
      setError(t("feedLoadFailed"));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [t]);

  const loadNextPage = useCallback(() => {
    if (!hasNext || loadingRef.current) return;
    loadFeedPage(page + 1, "append");
  }, [hasNext, loadFeedPage, page]);

  const reloadFeed = useCallback(() => {
    loadFeedPage(0, "replace");
  }, [loadFeedPage]);

  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasNext(true);
    loadStories();
    loadFeedPage(0, "replace");
  }, [feedVersion, loadFeedPage, loadStories]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadNextPage();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  useEffect(() => {
    const updateStoryLayout = () => {
      const nextLayout = getStoryLayoutForViewport(storyGroups.length);
      setStoryLayout((current) =>
        current.visibleCount === nextLayout.visibleCount &&
        current.tileWidth === nextLayout.tileWidth &&
        current.avatarSize === nextLayout.avatarSize &&
        current.navNudgeSpace === nextLayout.navNudgeSpace
          ? current
          : nextLayout,
      );
    };

    updateStoryLayout();
    window.addEventListener("resize", updateStoryLayout);
    return () => window.removeEventListener("resize", updateStoryLayout);
  }, [storyGroups.length]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(storyGroups.length / storyLayout.visibleCount) - 1);
    setStoryPage((current) => Math.min(current, maxPage));
  }, [storyGroups.length, storyLayout.visibleCount]);

  const storyStart = storyPage * storyLayout.visibleCount;
  const visibleStoryGroups = storyGroups.slice(storyStart, storyStart + storyLayout.visibleCount);
  const viewableStoryGroups = storyGroups.filter((group) => group.stories.length > 0);
  const viewerInitialIndex = viewableStoryGroups.findIndex((group) => group.userId === viewerUserId);
  const storyPageCount = Math.ceil(storyGroups.length / storyLayout.visibleCount);
  const canPreviousStories = storyPage > 0;
  const canNextStories = storyPage < storyPageCount - 1;
  const storyRailLeftSpace = canPreviousStories ? storyLayout.navNudgeSpace : 0;
  const storyRailRightSpace = canNextStories ? storyLayout.navNudgeSpace : 0;
  const openStoryGroup = (group) => {
    if (group.isOwner && !hasStories(group)) {
      onCreateStory?.();
      return;
    }
    setViewerUserId(group.userId);
  };

  return (
    <div className="mx-auto flex w-full max-w-[980px] justify-center px-2 pb-20 pt-4 md:pt-10">
      <div className="w-full max-w-[600px]">
        {storyGroups.length > 0 && (
          <section className="border-b border-gray-100 py-4 dark:border-gray-900">
            <div className="relative px-2">
              <div
                className="flex justify-start gap-3 overflow-hidden"
                style={{
                  paddingLeft: `${storyRailLeftSpace}px`,
                  paddingRight: `${storyRailRightSpace}px`,
                }}
              >
                {visibleStoryGroups.map((group) => (
                  <button
                    key={group.userId}
                    onClick={() => openStoryGroup(group)}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                    style={{ width: `${storyLayout.tileWidth}px` }}
                  >
                    <div className={`relative shrink-0 rounded-full p-[2.5px] ${getStoryRingClass(group)}`}>
                      <div className="rounded-full bg-white p-[2px] dark:bg-black">
                        <img
                          src={group.profileImageUrl}
                          alt=""
                          className="shrink-0 rounded-full object-cover"
                          style={{ width: `${storyLayout.avatarSize}px`, height: `${storyLayout.avatarSize}px` }}
                        />
                      </div>
                      {group.isOwner && !hasStories(group) && (
                        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white text-black shadow-sm ring-1 ring-gray-300 dark:border-black dark:bg-zinc-900 dark:text-white dark:ring-zinc-700">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <span className="max-w-full truncate text-center text-[11px] text-gray-500" style={{ width: `${storyLayout.tileWidth}px` }}>
                      {group.isOwner ? t("yourStory") : group.username}
                    </span>
                  </button>
                ))}
              </div>
              {storyPageCount > 1 && (
                <>
                  <button
                    onClick={() => setStoryPage((value) => Math.max(0, value - 1))}
                    disabled={!canPreviousStories}
                    className={`absolute left-0 top-[30px] flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-900 ${
                      canPreviousStories ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                    aria-label="Previous stories"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setStoryPage((value) => Math.min(storyPageCount - 1, value + 1))}
                    disabled={!canNextStories}
                    className={`absolute right-0 top-[30px] flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-900 ${
                      canNextStories ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                    aria-label="Next stories"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </section>
        )}
        <section className="mt-4 flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.postId} post={post} onChanged={reloadFeed} onOpenDetail={setSelectedPostId} />
          ))}
        </section>
        {!loading && !error && posts.length === 0 && (
          <div className="py-16 text-center text-sm font-semibold text-gray-400">{t("noFeedPosts")}</div>
        )}
        {error && (
          <div className="my-6 rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-center dark:border-red-950 dark:bg-red-950/20">
            <p className="text-sm font-semibold text-red-500">{error}</p>
            <button onClick={reloadFeed} className="mt-2 text-xs font-bold text-red-500">{t("tryAgain")}</button>
          </div>
        )}
        <div ref={sentinelRef} className="py-6 text-center text-xs font-semibold text-gray-400">
          {loading ? t("loadingPosts") : hasNext || posts.length === 0 || error ? "" : t("allPostsLoaded")}
        </div>
      </div>
      {viewerUserId !== null && viewerInitialIndex >= 0 && (
        <StoryViewer
          groups={viewableStoryGroups}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerUserId(null)}
          onDeleted={loadStories}
          onViewed={loadStories}
        />
      )}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onChanged={reloadFeed}
          onEdit={setEditingPost}
        />
      )}
      {editingPost && (
        <PostEditModal
          post={editingPost}
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          onSaved={() => {
            setEditingPost(null);
            setSelectedPostId(null);
            reloadFeed();
          }}
        />
      )}
    </div>
  );
}
