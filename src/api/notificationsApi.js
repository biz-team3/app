import { db, findUserById, getCurrentUser, getProfileImage } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

function toFollowRequest(request) {
  const requester = findUserById(request.requesterId);
  return {
    requestId: request.requestId,
    requesterId: request.requesterId,
    targetUserId: request.targetUserId,
    username: requester?.username || request.username,
    mutualText: request.mutualText,
    imageUrl: requester ? getProfileImage(requester) : request.imageUrl,
  };
}

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

// TODO API: Spring Boot 연동 시 GET /api/follow-requests 로 교체
export async function getFollowRequests() {
  const viewer = getCurrentUser();
  return mockResponse({
    requests: db.followRequests
      .filter((request) => request.targetUserId === viewer.userId && request.status === "PENDING")
      .map(toFollowRequest),
  });
}

// TODO API: Spring Boot 연동 시 POST /api/follow-requests/{requestId}/accept 204 No Content로 교체
export async function acceptFollowRequest(requestId) {
  const request = db.followRequests.find((item) => item.requestId === Number(requestId));
  const viewer = getCurrentUser();
  if (!request || request.targetUserId !== viewer.userId || request.status !== "PENDING") {
    return mockError("Follow request not found", 404);
  }
  if (request) {
    const requester = findUserById(request.requesterId);
    const target = findUserById(request.targetUserId);
    if (requester && target && !requester.followingIds.includes(target.userId)) {
      requester.followingIds.push(target.userId);
      requester.followingCount += 1;
      target.followerCount += 1;
    }
  }
  db.followRequests = db.followRequests.filter((request) => request.requestId !== Number(requestId));
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 DELETE /api/follow-requests/{requestId} 204 No Content로 교체
export async function rejectFollowRequest(requestId) {
  const viewer = getCurrentUser();
  const request = db.followRequests.find((item) => item.requestId === Number(requestId));
  if (!request || request.targetUserId !== viewer.userId || request.status !== "PENDING") {
    return mockError("Follow request not found", 404);
  }
  db.followRequests = db.followRequests.filter((request) => request.requestId !== Number(requestId));
  return mockResponse(null);
}
