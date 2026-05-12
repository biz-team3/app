import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getFeedPosts } from "../../api/postsApi.js";
import { getFeedStories } from "../../api/storiesApi.js";
import { StoryViewer } from "../story/StoryViewer.jsx";
import { PostCard } from "../post/PostCard.jsx";
import { PostDetailModal } from "../post/PostDetailModal.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function getStoriesPerPage() {
  if (typeof window === "undefined") return 4;
  if (window.matchMedia("(min-width: 1024px)").matches) return 7;
  if (window.matchMedia("(min-width: 480px)").matches) return 5;
  return 4;
}

export function FeedPage() {
  const { feedVersion, onCreateStory } = useOutletContext();
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [storyPage, setStoryPage] = useState(0);
  const [storiesPerPage, setStoriesPerPage] = useState(getStoriesPerPage);
  const [viewerUserId, setViewerUserId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const loadStories = async () => {
    const stories = await getFeedStories();
    setStoryGroups(stories.storyGroups);
    setStoryPage(0);
  };

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
  }, [feedVersion, loadFeedPage]);

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
    const handleResize = () => {
      setStoriesPerPage((current) => {
        const next = getStoriesPerPage();
        return current === next ? current : next;
      });
      setStoryPage(0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const storyStart = storyPage * storiesPerPage;
  const visibleStoryGroups = storyGroups.slice(storyStart, storyStart + storiesPerPage);
  const viewableStoryGroups = storyGroups.filter((group) => group.stories.length > 0);
  const viewerInitialIndex = viewableStoryGroups.findIndex((group) => group.userId === viewerUserId);
  const storyPageCount = Math.ceil(storyGroups.length / storiesPerPage);
  const canPreviousStories = storyPage > 0;
  const canNextStories = storyPage < storyPageCount - 1;
  const openStoryGroup = (group) => {
    if (group.isOwner && group.stories.length === 0) {
      onCreateStory?.();
      return;
    }
    if (group.stories.length > 0) setViewerUserId(group.userId);
  };

  return (
    <div className="mx-auto flex w-full max-w-[980px] justify-center px-2 pb-20 pt-4 md:pt-10">
      <div className="w-full max-w-[600px]">
        <section className="border-b border-gray-100 py-4 dark:border-gray-900">
          <div className="relative px-2">
            <div className="grid gap-x-3 gap-y-4" style={{ gridTemplateColumns: `repeat(${storiesPerPage}, minmax(0, 1fr))` }}>
              {visibleStoryGroups.map((group) => (
                <button key={group.userId} onClick={() => openStoryGroup(group)} className="flex min-w-0 flex-col items-center gap-1.5">
                  <div className={`rounded-full p-[2.5px] ${group.stories.length > 0 ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : "bg-gray-200 dark:bg-gray-800"}`}>
                    <div className="rounded-full bg-white p-[2px] dark:bg-black">
                      <span className="relative block">
                        <img src={group.profileImageUrl} alt="" className="h-14 w-14 rounded-full object-cover sm:h-[58px] sm:w-[58px]" />
                        {group.isOwner && group.stories.length === 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white dark:border-black">
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="w-16 truncate text-center text-[11px] text-gray-500">{group.isOwner ? t("yourStory") : group.username}</span>
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
        <StoryViewer groups={viewableStoryGroups} initialIndex={viewerInitialIndex} onClose={() => setViewerUserId(null)} onDeleted={loadStories} />
      )}
      {selectedPostId && <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onChanged={reloadFeed} />}
    </div>
  );
}
