import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { followUser, getFollowers, getFollowing, unfollowUser } from "../../api/followsApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";

const FOLLOW_LIST_PAGE_SIZE = 20;

export function FollowListModal({ type, userId, onClose, onChanged }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (targetPage = 0, mode = "replace") => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError("");

      try {
        const request = type === "followers" ? getFollowers : getFollowing;
        const result = await request(userId, { page: targetPage, size: FOLLOW_LIST_PAGE_SIZE });
        setUsers((current) => (mode === "append" ? [...current, ...result.content] : result.content));
        setPage(result.pageRequest.page);
        setHasNext(result.hasNext);
      } catch {
        setError(t("usersLoadFailed"));
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [t, type, userId],
  );

  useEffect(() => {
    setUsers([]);
    setPage(0);
    setHasNext(false);
    loadPage(0, "replace");
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNext && !loadingRef.current) {
          loadPage(page + 1, "append");
        }
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, loadPage, page]);

  const handleToggleFollow = async (targetUser) => {
    try {
      if (targetUser.viewerRelation === "FOLLOWING" || targetUser.viewerRelation === "PENDING") await unfollowUser(targetUser.userId);
      else await followUser(targetUser.userId);
      await loadPage(0, "replace");
      onChanged?.();
    } catch {
      setError(t("followActionFailed"));
    }
  };

  const getFollowLabel = (targetUser) => {
    if (targetUser.viewerRelation === "FOLLOWING") return t("following");
    if (targetUser.viewerRelation === "PENDING") return t("requested");
    return t("follow");
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
      <section
        className="flex max-h-[520px] w-full max-w-[420px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-black"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid grid-cols-3 items-center border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <div />
          <h2 className="text-center text-sm font-bold leading-none">{type === "followers" ? t("followers") : t("followingCount")}</h2>
          <button onClick={onClose} className="justify-self-end rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-900">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {error ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-red-500">{error}</p>
              <button onClick={() => loadPage(0, "replace")} className="mt-3 text-xs font-bold text-blue-500">{t("tryAgain")}</button>
            </div>
          ) : users.length > 0 ? (
            <>
              {users.map((user) => (
                <div key={user.userId} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link to={`/profile/${user.username}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                    <img src={user.profileImg} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{user.username}</span>
                      <span className="block truncate text-sm text-gray-500">{user.name}</span>
                    </span>
                  </Link>

                  {user.viewerRelation !== "SELF" && (
                    <button
                      onClick={() => handleToggleFollow(user)}
                      className={`rounded-lg px-4 py-1.5 text-sm font-bold ${
                        user.viewerRelation === "NOT_FOLLOWING" ? "bg-blue-500 text-white" : "bg-gray-100 text-black dark:bg-gray-800 dark:text-white"
                      }`}
                    >
                      {getFollowLabel(user)}
                    </button>
                  )}
                </div>
              ))}
              <div ref={sentinelRef} className="h-8 py-2 text-center text-xs text-gray-400">
                {loading ? t("loadingUsers") : ""}
              </div>
            </>
          ) : loading ? (
            <div className="px-6 py-14 text-center text-sm font-semibold text-gray-400">{t("loadingUsers")}</div>
          ) : (
            <div className="px-6 py-14 text-center text-sm text-gray-500">
              {type === "followers" ? t("noFollowers") : t("noFollowing")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
