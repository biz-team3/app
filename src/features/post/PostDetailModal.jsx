import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createComment, deleteComment, getPostComments, updateComment } from "../../api/commentsApi.js";
import { getPostDetail, likePost, savePost, unlikePost, unsavePost } from "../../api/postsApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog.jsx";

const COMMENTS_PAGE_SIZE = 20;

export function PostDetailModal({ postId, onClose, onChanged }) {
  const { t } = useLanguage();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(0);
  const [commentsHasNext, setCommentsHasNext] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [actionError, setActionError] = useState("");
  const [currentMedia, setCurrentMedia] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [deletingComment, setDeletingComment] = useState(null);
  const commentsScrollRef = useRef(null);
  const commentsSentinelRef = useRef(null);

  const load = async () => {
    setError("");
    try {
      const [postResult, commentResult] = await Promise.all([getPostDetail(postId), getPostComments(postId, { page: 0, size: COMMENTS_PAGE_SIZE })]);
      setPost(postResult);
      setComments(commentResult.content);
      setCommentPage(commentResult.pageRequest.page);
      setCommentsHasNext(commentResult.hasNext);
    } catch {
      setError(t("postLoadFailed"));
    }
  };

  const loadNextComments = async () => {
    if (commentsLoading || !commentsHasNext) return;
    setCommentsLoading(true);
    try {
      const nextPage = commentPage + 1;
      const result = await getPostComments(postId, { page: nextPage, size: COMMENTS_PAGE_SIZE });
      setComments((prevComments) => [...prevComments, ...result.content]);
      setCommentPage(result.pageRequest.page);
      setCommentsHasNext(result.hasNext);
    } catch {
      setError(t("commentsLoadFailed"));
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    setPost(null);
    setComments([]);
    setCommentPage(0);
    setCommentsHasNext(false);
    setCommentsLoading(false);
    setError("");
    setActionError("");
    setCurrentMedia(0);
    setCommentText("");
    setEditingCommentId(null);
    setEditingCommentText("");
    setDeletingComment(null);
    load();
  }, [postId]);

  useEffect(() => {
    const sentinel = commentsSentinelRef.current;
    if (!sentinel || !commentsHasNext) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextComments();
      },
      { root: commentsScrollRef.current, rootMargin: "120px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [commentsHasNext, commentsLoading, commentPage]);

  if (!post) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
        <section className="w-full max-w-[360px] rounded-2xl bg-white p-5 text-center shadow-2xl dark:bg-zinc-950" onMouseDown={(event) => event.stopPropagation()}>
          <p className={`text-sm font-semibold ${error ? "text-red-500" : "text-gray-500"}`}>{error || t("loadingPost")}</p>
          {error && <button onClick={load} className="mt-3 text-xs font-bold text-blue-500">{t("tryAgain")}</button>}
        </section>
      </div>
    );
  }

  const mediaCount = post.media.length;

  const toggleLike = async () => {
    setActionError("");
    try {
      if (post.likedByMe) await unlikePost(post.postId);
      else await likePost(post.postId);
      await load();
      onChanged?.();
    } catch {
      setActionError(t("postActionFailed"));
    }
  };

  const toggleSave = async () => {
    setActionError("");
    try {
      if (post.savedByMe) await unsavePost(post.postId);
      else await savePost(post.postId);
      await load();
      onChanged?.();
    } catch {
      setActionError(t("postActionFailed"));
    }
  };

  const handleCreateComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setActionError("");
    try {
      await createComment(post.postId, { text: commentText });
      setCommentText("");
      await load();
      onChanged?.();
    } catch {
      setActionError(t("commentActionFailed"));
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditingCommentText(comment.text);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentText.trim()) return;
    setActionError("");
    try {
      await updateComment(editingCommentId, { text: editingCommentText.trim() });
      setEditingCommentId(null);
      setEditingCommentText("");
      await load();
    } catch {
      setActionError(t("commentActionFailed"));
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingComment) return;
    setActionError("");
    try {
      await deleteComment(deletingComment.commentId);
      setDeletingComment(null);
      await load();
      onChanged?.();
    } catch {
      setDeletingComment(null);
      setActionError(t("commentActionFailed"));
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
      <article
        className="grid h-[min(780px,92vh)] w-full max-w-[1120px] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-black md:grid-cols-[minmax(0,1fr)_390px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-0 overflow-hidden bg-white dark:bg-zinc-950">
          <div className="flex h-full w-full transition-transform duration-300" style={{ transform: `translateX(-${currentMedia * 100}%)` }}>
            {post.media.map((media) => (
              <img key={media.mediaId} src={media.url} alt="" className="h-full w-full shrink-0 object-cover" />
            ))}
          </div>
          {currentMedia > 0 && (
            <button onClick={() => setCurrentMedia((value) => value - 1)} className="absolute left-3 top-1/2 rounded-full bg-white/80 p-1.5 text-black shadow-sm">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentMedia < mediaCount - 1 && (
            <button onClick={() => setCurrentMedia((value) => value + 1)} className="absolute right-3 top-1/2 rounded-full bg-white/80 p-1.5 text-black shadow-sm">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          {mediaCount > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white">
              {currentMedia + 1} / {mediaCount}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col border-l border-gray-200 dark:border-gray-800">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <img src={post.author.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              <Link to={`/profile/${post.author.username}`} onClick={onClose} className="text-sm font-bold hover:underline">
                {post.author.username}
              </Link>
            </div>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-900">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={commentsScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-5 text-sm leading-relaxed">
              <p>{post.caption}</p>
            </div>

            <div className="flex flex-col gap-4">
              {comments.map((comment) => (
                <div key={comment.commentId} className="flex gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold dark:bg-gray-900">
                    {comment.author.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingCommentId === comment.commentId ? (
                      <div className="rounded-xl border border-gray-200 p-2 dark:border-gray-800">
                        <input
                          value={editingCommentText}
                          onChange={(event) => setEditingCommentText(event.target.value)}
                          className="w-full bg-transparent text-sm outline-none"
                          autoFocus
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button onClick={() => setEditingCommentId(null)} className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold dark:bg-gray-800">
                            {t("cancel")}
                          </button>
                          <button onClick={handleUpdateComment} className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-bold text-white">
                            {t("save")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed">
                        <span className="mr-2 font-bold">{comment.author.username}</span>
                        {comment.text}
                      </p>
                    )}
                    <div className="mt-1 flex gap-3 text-xs text-gray-400">
                      <span>{comment.createdAtText}</span>
                      {comment.viewerPermissions?.canEdit && editingCommentId !== comment.commentId && <button onClick={() => startEditComment(comment)}>{t("edit")}</button>}
                      {comment.viewerPermissions?.canDelete && <button onClick={() => setDeletingComment(comment)} className="text-red-400">{t("delete")}</button>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={commentsSentinelRef} className="h-1" />
              {commentsLoading && <p className="py-2 text-center text-xs font-semibold text-gray-400">{t("loadingComments")}</p>}
              {error && <p className="py-2 text-center text-xs font-semibold text-red-500">{error}</p>}
            </div>
          </div>

          <footer className="border-t border-gray-100 dark:border-gray-800">
            {actionError ? <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 dark:bg-red-950/30">{actionError}</p> : null}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex gap-4">
                <button onClick={toggleLike}>
                  <Heart className={`h-6 w-6 ${post.likedByMe ? "fill-red-500 text-red-500" : ""}`} />
                </button>
                <MessageCircle className="h-6 w-6" />
              </div>
              <button onClick={toggleSave} aria-label={post.savedByMe ? t("unsavePost") : t("savePost")}>
                <Bookmark className={`h-6 w-6 ${post.savedByMe ? "fill-yellow-400 text-yellow-400" : ""}`} />
              </button>
            </div>
            <div className="px-4 pb-3">
              <p className="text-sm font-bold">{post.likeCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-400">{post.createdAtText}</p>
            </div>
            <form onSubmit={handleCreateComment} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={t("addComment")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              <button className="text-sm font-bold text-blue-500">{t("post")}</button>
            </form>
          </footer>
        </div>
      </article>
      {deletingComment && (
        <ConfirmDialog
          title={t("deleteCommentTitle")}
          description={t("deleteCommentDesc")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          destructive
          onConfirm={handleDeleteComment}
          onCancel={() => setDeletingComment(null)}
        />
      )}
    </div>
  );
}
