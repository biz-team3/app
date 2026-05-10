import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { deletePost, likePost, savePost, unlikePost, unsavePost } from "../../api/postsApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog.jsx";
import { PostEditModal } from "../../components/modals/PostEditModal.jsx";
import { formatRelativeTime } from "../../utils/format.js";

export function PostCard({ post, onChanged, onOpenDetail }) {
  const { t } = useLanguage();
  const [currentMedia, setCurrentMedia] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [actionError, setActionError] = useState("");
  const menuRef = useRef(null);

  const mediaCount = post.media.length;
  const captionText = translated ? post.translatedCaption : post.caption;
  const canManagePost = post.isOwner;
  const postTimeText = formatRelativeTime(post.createdAt);

  useEffect(() => {
    setCurrentMedia(0);
    setMenuOpen(false);
    setEditOpen(false);
    setDeletingPost(false);
    setActionError("");
  }, [post.postId, post.caption, post.media]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLike = async () => {
    setActionError("");
    try {
      if (post.likedByMe) await unlikePost(post.postId);
      else await likePost(post.postId);
      onChanged();
    } catch {
      setActionError(t("postActionFailed"));
    }
  };

  const toggleSave = async () => {
    setActionError("");
    try {
      if (post.savedByMe) await unsavePost(post.postId);
      else await savePost(post.postId);
      onChanged();
    } catch {
      setActionError(t("postActionFailed"));
    }
  };

  const handleDeletePost = async () => {
    setActionError("");
    try {
      await deletePost(post.postId);
      setDeletingPost(false);
      onChanged();
    } catch {
      setDeletingPost(false);
      setActionError(t("postActionFailed"));
    }
  };

  return (
    <article className="overflow-hidden bg-white shadow-sm dark:bg-black md:rounded-xl md:border md:border-gray-200 md:dark:border-gray-800">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={post.author.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          <div>
            <Link to={`/profile/${post.author.username}`} className="text-sm font-bold hover:underline">
              {post.author.username}
            </Link>
            <span className="ml-1 text-sm text-gray-400">• {postTimeText}</span>
            {post.suggested && <p className="text-[11px] font-medium text-gray-500">{t("suggested")}</p>}
          </div>
        </div>
        {canManagePost && (
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen((value) => !value)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900" aria-label={t("postOptions")}>
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white text-sm shadow-xl dark:border-gray-800 dark:bg-gray-950">
                {post.isOwner && (
                  <button
                    onClick={() => {
                      setEditOpen(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    {t("editPost")}
                  </button>
                )}
                {post.isOwner && (
                  <button
                    onClick={() => {
                      setDeletingPost(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-left font-semibold text-red-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    {t("deletePost")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </header>
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900" onClick={() => onOpenDetail?.(post.postId)} onDoubleClick={toggleLike}>
        <div className="flex h-full w-full transition-transform duration-300" style={{ transform: `translateX(-${currentMedia * 100}%)` }}>
          {post.media.map((media) => (
            <img key={media.mediaId} src={media.url} alt="" className="h-full w-full shrink-0 object-cover" />
          ))}
        </div>
        {currentMedia > 0 && <button onClick={(event) => { event.stopPropagation(); setCurrentMedia((value) => value - 1); }} className="absolute left-2 top-1/2 rounded-full bg-white/70 p-1"><ChevronLeft className="h-5 w-5 text-black" /></button>}
        {currentMedia < mediaCount - 1 && <button onClick={(event) => { event.stopPropagation(); setCurrentMedia((value) => value + 1); }} className="absolute right-2 top-1/2 rounded-full bg-white/70 p-1"><ChevronRight className="h-5 w-5 text-black" /></button>}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button onClick={toggleLike} className="flex items-center gap-1.5">
              <Heart className={`h-6 w-6 ${post.likedByMe ? "fill-red-500 text-red-500" : ""}`} />
              <span className="text-sm font-bold">{post.likeCount.toLocaleString()}</span>
            </button>
            <button onClick={() => onOpenDetail?.(post.postId)} className="flex items-center gap-1.5">
              <MessageCircle className="h-6 w-6" />
              <span className="text-sm font-bold">{post.commentCount}</span>
            </button>
          </div>
          <button onClick={toggleSave} aria-label={post.savedByMe ? t("unsavePost") : t("savePost")}>
            <Bookmark className={`h-6 w-6 ${post.savedByMe ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>
        </div>
        {actionError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 dark:bg-red-950/30">{actionError}</p> : null}
        <p className="text-sm leading-relaxed">
          <span className="mr-2 font-bold">{post.author.username}</span>
          {expanded ? captionText : captionText.slice(0, 70)}
          {captionText.length > 70 && !expanded && <button onClick={() => setExpanded(true)} className="ml-1 text-gray-400">... {t("more")}</button>}
        </p>
        <button onClick={() => setTranslated((value) => !value)} className="w-fit text-[10px] font-bold uppercase text-gray-500">
          {translated ? t("seeOriginal") : t("seeTranslation")}
        </button>
      </div>
      {deletingPost && (
        <ConfirmDialog
          title={t("deletePostTitle")}
          description={t("deletePostDesc")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          destructive
          onConfirm={handleDeletePost}
          onCancel={() => setDeletingPost(false)}
        />
      )}
      <PostEditModal post={post} isOpen={editOpen} onClose={() => setEditOpen(false)} onSaved={onChanged} />
    </article>
  );
}
