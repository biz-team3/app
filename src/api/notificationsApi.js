import { apiRequest } from "./apiClient.js";

export async function getNotifications() {
  return apiRequest("/api/notifications");
}

export async function markNotificationsRead(payload = {}) {
  await apiRequest("/api/notifications/read", {
    method: "PATCH",
    body: JSON.stringify({
      notificationIds: payload.notificationIds?.map(Number) || [],
    }),
  });

  return null;
}

export async function getNotificationSummary() {
  return apiRequest("/api/notifications/summary");
}

export async function getFollowRequests() {
  return apiRequest("/api/follow-requests");
}

export async function acceptFollowRequest(requestId) {
  await apiRequest(`/api/follow-requests/${requestId}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return null;
}

export async function rejectFollowRequest(requestId) {
  await apiRequest(`/api/follow-requests/${requestId}`, {
    method: "DELETE",
  });

  return null;
}
