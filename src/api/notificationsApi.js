import { db, getCurrentUser } from "../mocks/db.js";
import { apiRequest, mockResponse } from "./mockClient.js";

// TODO API: Spring Boot 연동 시 GET /api/notifications 로 교체
export async function getNotifications() {
  return mockResponse({ notifications: db.notifications });
}

// TODO API: Spring Boot 연동 시 PATCH /api/notifications/read 204 No Content로 교체
export async function markNotificationsRead(payload = {}) {
  const ids = payload.notificationIds?.map(Number) || db.notifications.map((notification) => notification.notificationId);
  db.notifications.forEach((notification) => {
    if (ids.includes(notification.notificationId)) notification.read = true;
  });
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 GET /api/notifications/summary 로 교체
export async function getNotificationSummary() {
  const viewer = getCurrentUser();
  const unreadNotificationCount = db.notifications.filter((notification) => notification.read !== true).length;
  const pendingFollowRequestCount = db.followRequests.filter(
    (request) => request.targetUserId === viewer.userId && request.status === "PENDING",
  ).length;

  return mockResponse({
    unreadNotificationCount,
    pendingFollowRequestCount,
    totalBadgeCount: unreadNotificationCount + pendingFollowRequestCount,
  });
}

export async function getFollowRequests() {
  const requests = await apiRequest("/api/follows/requests");
  return { requests };
}

export async function acceptFollowRequest(requestId) {
  await apiRequest(`/api/follows/requests/${requestId}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return null;
}

export async function rejectFollowRequest(requestId) {
  await apiRequest(`/api/follows/requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return null;
}
