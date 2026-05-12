import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Heart, X } from "lucide-react";
import {
  acceptFollowRequest,
  getFollowRequests,
  getNotifications,
  markNotificationsRead,
  rejectFollowRequest,
} from "../../api/notificationsApi.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { formatRelativeTime } from "../../utils/format.js";

export function NotificationPanel({ isOpen, onClose, onChanged }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [notificationResult, requestResult] = await Promise.all([getNotifications(), getFollowRequests()]);
      setNotifications(notificationResult.notifications);
      setRequests(requestResult.requests);
      const unreadNotificationIds = notificationResult.notifications
        .filter((notification) => notification.read !== true)
        .map((notification) => notification.notificationId);
      if (unreadNotificationIds.length > 0) {
        await markNotificationsRead({ notificationIds: unreadNotificationIds });
        setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
        onChanged?.();
      }
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

  if (!isOpen) return null;

  const todayNotifications = notifications.filter((item) => item.period === "today");
  const weekNotifications = notifications.filter((item) => item.period === "week");

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
                  <img src={requests[0]?.imageUrl || "https://randomuser.me/api/portraits/women/27.jpg"} className="h-11 w-11 rounded-full object-cover" alt="" />
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
                  {todayNotifications.length > 0 ? todayNotifications.map((item) => <NotificationItem key={item.notificationId} item={item} t={t} />) : <p className="text-sm text-gray-500">{t("noTodayNotifications")}</p>}
                </section>
                <section className="border-t border-gray-100 px-6 py-5 dark:border-gray-900">
                  <h3 className="mb-4 font-bold">{t("thisWeek")}</h3>
                  {weekNotifications.length > 0 ? weekNotifications.map((item) => <NotificationItem key={item.notificationId} item={item} t={t} />) : <p className="text-sm text-gray-500">{t("noWeekNotifications")}</p>}
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
                      <img src={request.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold">{request.username}</p>
                        <p className="w-36 truncate text-sm text-gray-500">{formatMutualText(request, t)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(request.requestId)} className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-bold text-white">{t("confirm")}</button>
                      <button onClick={() => handleReject(request.requestId)} className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-bold dark:bg-gray-800">{t("delete")}</button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function NotificationItem({ item, t }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative shrink-0">
          <img src={item.actorImageUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          {item.type === "LIKE" && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 dark:border-black">
              <Heart className="h-3 w-3 fill-white text-white" />
            </span>
          )}
        </div>
        <p className="text-sm">
          <span className="font-bold">{item.actorName}</span>
          {item.type === "LIKE"
            ? t("likedByOthers", { count: item.actorCount })
            : t("startedFollowing")}
          <span className="ml-1 text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
        </p>
      </div>
      {item.targetImageUrl ? (
        <img src={item.targetImageUrl} alt="" className="h-11 w-11 rounded object-cover" />
      ) : (
        <button className={`rounded-lg px-4 py-1.5 text-sm font-bold ${item.primary ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
          {item.primary ? t("follow") : t("following")}
        </button>
      )}
    </div>
  );
}

function formatMutualText(request, t) {
  const matchMany = request.mutualText?.match(/^(.+)님 외 (\d+)명이/);
  if (matchMany) return t("mutualFollowers", { name: matchMany[1], count: matchMany[2] });

  const matchOne = request.mutualText?.match(/^(.+)님이/);
  if (matchOne) return t("mutualFollowerOne", { name: matchOne[1] });

  return request.mutualText;
}
