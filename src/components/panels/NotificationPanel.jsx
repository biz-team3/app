import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Heart, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { followUser, unfollowUser } from "../../api/followsApi.js";
import {
  acceptFollowRequest,
  getFollowRequests,
  getNotifications,
  markNotificationsRead,
  rejectFollowRequest,
} from "../../api/notificationsApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { formatRelativeTime } from "../../utils/format.js";
import { PostDetailModal } from "../../features/post/PostDetailModal.jsx";

export function NotificationPanel({ isOpen, onClose, onChanged }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  /** 알림 패널에서 follow / unfollow 요청 처리 중인 상대 유저 id 목록 */
  const [pendingFollowUserIds, setPendingFollowUserIds] = useState([]);

  const hasUnreadNotifications = notifications.some((notification) => notification.read !== true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [notificationResult, requestResult] = await Promise.all([getNotifications(), getFollowRequests()]);
      setNotifications(notificationResult.notifications);
      setRequests(requestResult.requests);
    } catch {
      setError(t("notificationsLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    load();
  }, [isOpen]);

  const handleNotificationClick = async () => {
    if (!hasUnreadNotifications) return;

    try {
      await markNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      await onChanged?.();
    } catch {
      setError(t("notificationsLoadFailed"));
    }
  };

  const handleOpenProfile = async (username) => {
    if (!username) return;
    await handleNotificationClick();
    navigate(`/profile/${username}`);
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFollowRequest(requestId);
      setRequests((current) => current.filter((request) => request.requestId !== requestId));
      onChanged?.();
    } catch {
      setError(t("followRequestActionFailed"));
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFollowRequest(requestId);
      setRequests((current) => current.filter((request) => request.requestId !== requestId));
      onChanged?.();
    } catch {
      setError(t("followRequestActionFailed"));
    }
  };

  const handleToggleFollow = async (notification) => {
    if (!notification.actorUserId || notification.viewerRelation === "SELF") return;

    setPendingFollowUserIds((current) => [...current, notification.actorUserId]);

    try {
      await handleNotificationClick();
      if (notification.viewerRelation === "FOLLOWING" || notification.viewerRelation === "PENDING") {
        await unfollowUser(notification.actorUserId);
      } else {
        await followUser(notification.actorUserId);
      }
      await load();
      await onChanged?.();
    } catch {
      setError(t("followActionFailed"));
    } finally {
      setPendingFollowUserIds((current) => current.filter((userId) => userId !== notification.actorUserId));
    }
  };

  if (!isOpen) return null;

  const todayNotifications = notifications.filter((item) => getNotificationPeriod(item.createdAt) === "today");
  const weekNotifications = notifications.filter((item) => getNotificationPeriod(item.createdAt) === "week");

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="fixed left-0 top-0 z-[80] h-full w-full max-w-[420px] overflow-y-auto border-r border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-black md:left-20">
        {mode === "notifications" ? (
          <>
            <div className="sticky top-0 flex items-center justify-between bg-white p-6 dark:bg-black">
              <h2 className="text-2xl font-bold">{t("notifications")}</h2>
              <button onClick={onClose}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <button onClick={() => setMode("requests")} className="flex w-full items-center justify-between border-b border-gray-100 px-6 py-4 text-left hover:bg-gray-50 dark:border-gray-900 dark:hover:bg-gray-900">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={requests[0]?.requesterProfileImg || "https://randomuser.me/api/portraits/women/27.jpg"} className="h-11 w-11 rounded-full object-cover" alt="" />
                  {requests.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{requests.length}</span>}
                </div>
                <div>
                  <p className="text-sm font-bold">{t("followRequest")}</p>
                  <p className="text-sm text-gray-500">{t("followRequestDesc")}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          {loading && <p className="px-6 py-8 text-center text-sm font-semibold text-gray-400">{t("loadingNotifications")}</p>}
            {error && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm font-semibold text-red-500">{error}</p>
                <button onClick={load} className="mt-3 text-xs font-bold text-blue-500">{t("tryAgain")}</button>
              </div>
            )}
            {!loading && !error && notifications.length === 0 && <div className="px-6 py-16 text-center text-sm text-gray-500">{t("noNotifications")}</div>}
            {!loading && !error && notifications.length > 0 && (
              <>
                <section className="px-6 py-5">
                  <h3 className="mb-4 font-bold">{t("today")}</h3>
                  {todayNotifications.length > 0
                    ? todayNotifications.map((item) => (
                        <NotificationItem
                          key={item.notificationId}
                          item={item}
                          t={t}
                          onOpenPostDetail={setSelectedPostId}
                          onOpenProfile={handleOpenProfile}
                          onNotificationClick={handleNotificationClick}
                          onToggleFollow={handleToggleFollow}
                          followActionLoading={pendingFollowUserIds.includes(item.actorUserId)}
                        />
                      ))
                    : <p className="text-sm text-gray-500">{t("noTodayNotifications")}</p>}
                </section>
                <section className="border-t border-gray-100 px-6 py-5 dark:border-gray-900">
                  <h3 className="mb-4 font-bold">{t("thisWeek")}</h3>
                  {weekNotifications.length > 0
                    ? weekNotifications.map((item) => (
                        <NotificationItem
                          key={item.notificationId}
                          item={item}
                          t={t}
                          onOpenPostDetail={setSelectedPostId}
                          onOpenProfile={handleOpenProfile}
                          onNotificationClick={handleNotificationClick}
                          onToggleFollow={handleToggleFollow}
                          followActionLoading={pendingFollowUserIds.includes(item.actorUserId)}
                        />
                      ))
                    : <p className="text-sm text-gray-500">{t("noWeekNotifications")}</p>}
                </section>
              </>
            )}
          </>
        ) : (
          <>
            <div className="sticky top-0 flex items-center gap-6 bg-white px-6 py-8 dark:bg-black">
              <button onClick={() => setMode("notifications")}>
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold">{t("followRequests")}</h2>
            </div>
            <div className="px-2">
              {loading && <p className="px-4 py-12 text-center text-sm font-semibold text-gray-400">{t("loadingNotifications")}</p>}
              {error && (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-red-500">{error}</p>
                  <button onClick={load} className="mt-3 text-xs font-bold text-blue-500">{t("tryAgain")}</button>
                </div>
              )}
              {!loading && !error && requests.length === 0 && <div className="px-6 py-16 text-center text-sm text-gray-500">{t("noFollowRequests")}</div>}
              {!loading &&
                !error &&
                requests.map((request) => (
                  <div key={request.requestId} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${request.requesterName}`}>
                        <img src={request.requesterProfileImg} alt="" className="h-12 w-12 rounded-full object-cover" />
                      </Link>
                      <div>
                        <Link to={`/profile/${request.requesterName}`} className="text-sm font-bold hover:underline">
                          {request.requesterName}
                        </Link>
                        <p className="w-36 truncate text-sm text-gray-500">{formatMutualText(request, t)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(request.requestId)} className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-bold text-white">{t("accept")}</button>
                      <button onClick={() => handleReject(request.requestId)} className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-bold dark:bg-gray-800">{t("delete")}</button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </aside>
      {selectedPostId && <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onChanged={onChanged} />}
    </>
  );
}

function NotificationItem({ item, t, onOpenPostDetail, onOpenProfile, onNotificationClick, onToggleFollow, followActionLoading }) {
  const message = item.type === "LIKE"
    ? t("likedByOthers", { count: item.actorCount || 0 })
    : t("startedFollowing");
  const targetPostId = Number(item.targetId);
  const canOpenTargetPost = Number.isFinite(targetPostId);
  const showFollowButton = !item.targetImageUrl && item.viewerRelation !== "SELF";
  const followButtonLabel = item.viewerRelation === "FOLLOWING" ? t("following") : item.viewerRelation === "PENDING" ? t("requested") : t("follow");
  const followButtonClass =
    item.viewerRelation === "NOT_FOLLOWING"
      ? "bg-blue-500 text-white"
      : "bg-gray-100 text-black dark:bg-gray-800 dark:text-white";

  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-3">
        <button type="button" onClick={() => onOpenProfile(item.actorUsername)} className="relative shrink-0">
          <img src={item.actorImageUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          {item.type === "LIKE" && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 dark:border-black">
              <Heart className="h-3 w-3 fill-white text-white" />
            </span>
          )}
        </button>
        <p className="text-sm">
          {item.actorUsername ? (
            <button type="button" onClick={() => onOpenProfile(item.actorUsername)} className="font-bold hover:underline">
              {item.actorName || item.actorUsername}
            </button>
          ) : item.actorName ? (
            <span className="font-bold">{item.actorName}</span>
          ) : null}
          {message}
          <span className="ml-1 text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
        </p>
      </div>
      {item.targetImageUrl && canOpenTargetPost ? (
        <button
          type="button"
          onClick={async () => {
            await onNotificationClick();
            onOpenPostDetail(targetPostId);
          }}
          className="shrink-0 rounded"
        >
          <img src={item.targetImageUrl} alt="" className="h-11 w-11 rounded object-cover" />
        </button>
      ) : item.targetImageUrl && item.actorUsername ? (
        <button type="button" onClick={() => onOpenProfile(item.actorUsername)} className="shrink-0 rounded">
          <img src={item.targetImageUrl} alt="" className="h-11 w-11 rounded object-cover" />
        </button>
      ) : item.targetImageUrl ? (
        <img src={item.targetImageUrl} alt="" className="h-11 w-11 rounded object-cover" />
      ) : showFollowButton ? (
        <button
          onClick={() => onToggleFollow(item)}
          disabled={followActionLoading}
          className={`rounded-lg px-4 py-1.5 text-sm font-bold ${followButtonClass} ${followActionLoading ? "cursor-wait opacity-60" : ""}`}
        >
          {followButtonLabel}
        </button>
      ) : null}
    </div>
  );
}

function formatMutualText(request, t) {
  // 공통 팔로워 정보가 없으면 기본 안내 문구를 보여줌
  if (!request.mutualFollowerName || !request.mutualFollowerCount) {
    return t("followRequestDesc");
  }

  // count=1 이면 대표 username만 노출함
  if (request.mutualFollowerCount === 1) {
    return t("mutualFollowerOne", { name: request.mutualFollowerName });
  }

  // count>1 이면 대표 username 1명 + 나머지 인원 수로 문구를 조합함
  return t("mutualFollowers", {
    name: request.mutualFollowerName,
    count: request.mutualFollowerCount - 1,
  });
}

function getNotificationPeriod(createdAt) {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return "week";

  const diffMs = Math.max(0, Date.now() - timestamp);
  if (diffMs < 24 * 60 * 60 * 1000) return "today";
  return "week";
}
