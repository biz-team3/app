import { apiRequest } from "./apiClient.js";

function toQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getFollowers(userId, { page = 0, size = 20, query = "" } = {}) {
  return apiRequest(`/api/follows/${userId}/followers${toQueryString({ page, size, q: query })}`);
}

export async function getFollowing(userId, { page = 0, size = 20, query = "" } = {}) {
  return apiRequest(`/api/follows/${userId}/following${toQueryString({ page, size, q: query })}`);
}

export async function followUser(targetUserId) {
  await apiRequest(`/api/follows/${targetUserId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return null;
}

export async function unfollowUser(targetUserId) {
  await apiRequest(`/api/follows/${targetUserId}`, {
    method: "DELETE",
  });

  return null;
}
