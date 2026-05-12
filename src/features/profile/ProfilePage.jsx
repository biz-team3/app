import { useCallback, useEffect, useRef, useState } from "react";
import { Grid, Images, Lock } from "lucide-react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { followUser, unfollowUser } from "../../api/followsApi.js";
import { getMyProfile, getProfileByUsername, getProfilePosts } from "../../api/profileApi.js";
import { getStoryBundle } from "../../api/storiesApi.js";
import { StoryViewer } from "../story/StoryViewer.jsx";
import { PostDetailModal } from "../post/PostDetailModal.jsx";
import { FollowListModal } from "./FollowListModal.jsx";
import { ProfileEditModal } from "../../components/modals/ProfileEditModal.jsx";
import { formatCount } from "../../utils/format.js";
import { useLanguage } from "../../hooks/useLanguage.js";

const PROFILE_POST_PAGE_SIZE = 12;

export function ProfilePage() {
  const { username } = useParams();
  const { feedVersion, registerPageRefreshHandler } = useOutletContext();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [followListType, setFollowListType] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [postPage, setPostPage] = useState(0);
  const [postsHasNext, setPostsHasNext] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const postSentinelRef = useRef(null);
  const postsLoadingRef = useRef(false);

  const load = useCallback(async () => {
    setPostsError("");
    setPostsLoading(true);
    postsLoadingRef.current = true;
    try {
      const nextProfile = username ? await getProfileByUsername(username) : await getMyProfile();
      setProfile(nextProfile);
      const [postResult, storyResult] = await Promise.all([
        getProfilePosts(nextProfile.userId, { page: 0, size: PROFILE_POST_PAGE_SIZE }),
        getStoryBundle(nextProfile.userId),
      ]);
      setPosts(postResult.content);
      setStories(storyResult.stories);
      setPostPage(postResult.pageRequest.page);
      setPostsHasNext(postResult.hasNext);
    } catch {
      setPostsError(t("profileLoadFailed"));
    } finally {
      setPostsLoading(false);
      postsLoadingRef.current = false;
    }
  }, [feedVersion, t, username]);

  const loadNextPosts = useCallback(async () => {
    if (!profile || postsLoadingRef.current || !postsHasNext) return;
    postsLoadingRef.current = true;
    setPostsLoading(true);
    setPostsError("");
    try {
      const nextPage = postPage + 1;
      const result = await getProfilePosts(profile.userId, { page: nextPage, size: PROFILE_POST_PAGE_SIZE });
      setPosts((current) => [...current, ...result.content]);
      setPostPage(result.pageRequest.page);
      setPostsHasNext(result.hasNext);
    } catch {
      setPostsError(t("profilePostsLoadFailed"));
    } finally {
      setPostsLoading(false);
      postsLoadingRef.current = false;
    }
  }, [postPage, postsHasNext, profile, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    registerPageRefreshHandler?.(load);
    return () => registerPageRefreshHandler?.(null);
  }, [load, registerPageRefreshHandler]);

  useEffect(() => {
    const sentinel = postSentinelRef.current;
    if (!sentinel || !postsHasNext) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextPosts();
      },
      { rootMargin: "160px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPosts, postsHasNext]);

  if (!profile && postsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 text-center dark:bg-black">
        <div>
          <p className="text-sm font-semibold text-red-500">{postsError}</p>
          <button onClick={load} className="mt-3 text-xs font-bold text-blue-500">{t("tryAgain")}</button>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="min-h-screen bg-white dark:bg-black" />;

  const handleFollow = async () => {
    try {
      if (profile.viewerRelation === "FOLLOWING" || profile.viewerRelation === "PENDING") await unfollowUser(profile.userId);
      else await followUser(profile.userId);
      await load();
    } catch {
      setPostsError(t("followActionFailed"));
    }
  };

  const followButtonLabel = profile.viewerRelation === "FOLLOWING" ? t("following") : profile.viewerRelation === "PENDING" ? t("requested") : t("follow");
  const followButtonClass =
    profile.viewerRelation === "NOT_FOLLOWING"
      ? "bg-blue-500 text-white"
      : "bg-gray-100 text-black dark:bg-gray-800 dark:text-white";

  const hasProfileStories = stories.length > 0;
  const storyGroups = [
    {
      userId: profile.userId,
      username: profile.username,
      profileImageUrl: profile.profileImageUrl,
      isOwner: profile.isOwner,
      stories,
    },
  ];
  const handleProfileStoryClick = () => {
    if (hasProfileStories) setViewerOpen(true);
  };
  const mutualFollowerText = formatMutualFollowerText(profile, t);

  return (
    <div className="min-h-screen overflow-auto bg-white px-4 py-6 pb-24 text-black dark:bg-black dark:text-white md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <header className="mb-12 flex w-full flex-col items-center justify-center gap-8 md:flex-row md:gap-20">
          <button
            onClick={handleProfileStoryClick}
            disabled={!hasProfileStories}
            className={`h-28 w-28 rounded-full p-1 md:h-40 md:w-40 ${hasProfileStories ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : "bg-gray-200 dark:bg-gray-800"}`}
          >
            <img src={profile.profileImageUrl} alt="" className="h-full w-full rounded-full border-4 border-white object-cover dark:border-black" />
          </button>
          <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
            <div className="mb-5 flex flex-col items-center gap-4 md:flex-row">
              <h1 className="text-xl font-normal">{profile.username}</h1>
              {profile.isOwner ? (
                <button onClick={() => setEditOpen(true)} className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-semibold hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
                  {t("editProfile")}
                </button>
              ) : (
                <button onClick={handleFollow} className={`rounded-lg px-6 py-1.5 text-sm font-semibold ${followButtonClass}`}>
                  {followButtonLabel}
                </button>
              )}
            </div>
            <div className="mb-5 flex gap-8 text-[15px]">
              <span><strong>{profile.postCount}</strong> {t("posts")}</span>
              <button onClick={() => setFollowListType("followers")} className="text-left">
                <strong>{formatCount(profile.followerCount)}</strong> {t("followers")}
              </button>
              <button onClick={() => setFollowListType("following")} className="text-left">
                <strong>{formatCount(profile.followingCount)}</strong> {t("followingCount")}
              </button>
            </div>
            <div>
              <h2 className="text-[15px] font-bold">{profile.name}</h2>
              {mutualFollowerText && <p className="mt-1 text-sm text-gray-500">{mutualFollowerText}</p>}
              <p className="whitespace-pre-line text-[14px] leading-snug">{profile.bio}</p>
              {profile.website && <a href={profile.website} className="text-sm font-semibold text-blue-900 dark:text-blue-300">{profile.website}</a>}
            </div>
          </div>
        </header>

        <section className="w-full max-w-4xl border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 border-t border-black py-4 dark:border-white">
              <Grid className="h-4 w-4" />
              <span className="text-[12px] font-bold uppercase tracking-widest">{t("posts")}</span>
            </div>
          </div>
        </section>

        {!profile.canViewContent ? (
          <div className="flex w-full flex-col items-center justify-center border-t border-gray-200 py-24 text-center dark:border-gray-800">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-black dark:border-white">
              <Lock className="h-10 w-10" />
            </div>
            <h3 className="mb-2 text-lg font-bold">{t("privateAccount")}</h3>
            <p className="max-w-xs text-sm text-gray-500">{profile.viewerRelation === "PENDING" ? t("followRequestPendingDesc") : t("privateAccountDesc")}</p>
          </div>
        ) : postsError ? (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-red-500">{postsError}</p>
            <button onClick={load} className="mt-3 text-xs font-bold text-blue-500">{t("tryAgain")}</button>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid w-full max-w-5xl grid-cols-3 gap-1 pb-4 sm:gap-4">
              {posts.map((post) => (
                <button key={post.postId} onClick={() => setSelectedPostId(post.postId)} className="group relative aspect-square overflow-hidden text-left">
                  <img src={post.imageUrl} alt="" className="h-full w-full object-cover transition group-hover:brightness-75" />
                  {post.hasMultipleMedia && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/45 p-1 text-white shadow-sm">
                      <Images className="h-4 w-4" />
                    </span>
                  )}
                  <div className="absolute inset-0 hidden items-center justify-center gap-6 text-sm font-bold text-white group-hover:flex">
                    <span>♥ {post.likeCount}</span>
                    <span>💬 {post.commentCount}</span>
                  </div>
                </button>
              ))}
            </div>
            <div ref={postSentinelRef} className="min-h-10 pb-10 text-center text-xs font-semibold text-gray-400">
              {postsLoading ? t("loadingPosts") : postsHasNext ? "" : t("allPostsLoaded")}
            </div>
          </>
        ) : postsLoading ? (
          <div className="py-20 text-center text-sm font-semibold text-gray-400">{t("loadingPosts")}</div>
        ) : (
          <div className="py-20 text-center text-gray-500">{t("noPosts")}</div>
        )}
      </div>
      {viewerOpen && <StoryViewer groups={storyGroups} onClose={() => setViewerOpen(false)} onDeleted={load} />}
      {selectedPostId && <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onChanged={load} />}
      {followListType && <FollowListModal type={followListType} userId={profile.userId} onClose={() => setFollowListType(null)} onChanged={load} />}
      <ProfileEditModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSaved={load} />
    </div>
  );
}

function formatMutualFollowerText(profile, t) {
  if (profile.isOwner || !profile.mutualFollowerName || !profile.mutualFollowerCount) {
    return "";
  }

  if (profile.mutualFollowerCount === 1) {
    return t("mutualFollowerOne", { name: profile.mutualFollowerName });
  }

  return t("mutualFollowers", {
    name: profile.mutualFollowerName,
    count: profile.mutualFollowerCount - 1,
  });
}
