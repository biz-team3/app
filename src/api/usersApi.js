import { apiRequest } from "./mockClient.js";

const ACCOUNT_VISIBILITIES = ["PUBLIC", "PRIVATE"];

export function toUserSummary(user) {
  if (!user) return null;
  return {
    userId: user.userId,
    username: user.username,
    name: user.name,
    profileImageUrl: user.profileImageUrl || user.profileImg || "",
  };
}

function toUserRecord(user = {}) {
  return {
    userId: user.userId,
    username: user.username,
    name: user.name,
    bio: user.bio,
    website: user.website,
    profileImageUrl: user.profileImageUrl || user.profileImg || "",
    followerCount: user.followerCount || 0,
    followingCount: user.followingCount || 0,
    postCount: user.postCount || 0,
    accountVisibility: user.accountVisibility || user.accountVis || "PUBLIC",
  };
}

function normalizeUserPayload(payload) {
  const username = payload.username?.trim();
  const accountVisibility = payload.accountVisibility || "PUBLIC";
  if (!ACCOUNT_VISIBILITIES.includes(accountVisibility)) {
    throw Object.assign(new Error("accountVisibility must be PUBLIC or PRIVATE"), { status: 400 });
  }

  return {
    username,
    name: payload.name?.trim() || username,
    bio: payload.bio || "",
    website: payload.website || "",
    profileImageUrl: payload.profileImageUrl || "",
    profileImageUrls: payload.profileImageUrl ? [payload.profileImageUrl] : [],
    accountVisibility,
  };
}

export async function getUsers({ page = 0, size = 30, query = "" } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (query.trim()) params.set("q", query.trim());
  const result = await apiRequest(`/api/users?${params.toString()}`);
  return {
    users: (result.users || []).map(toUserRecord),
    page: result.page ?? page,
    size: result.size ?? size,
    totalElements: result.totalElements ?? 0,
    totalPages: result.totalPages ?? 0,
    hasNext: Boolean(result.hasNext),
  };
}

export async function createUser(payload) {
  const result = await apiRequest("/api/users", {
    method: "POST",
    body: JSON.stringify(normalizeUserPayload(payload)),
  });
  return result ? toUserSummary(result) : null;
}

export async function getUserById(userId) {
  return toUserSummary(await apiRequest(`/api/users/${userId}`));
}

export async function getUserByUsername(username) {
  return toUserSummary(await apiRequest(`/api/users/by-username/${encodeURIComponent(username)}`));
}

export async function updateUser(userId, payload) {
  const result = await apiRequest(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(normalizeUserPayload(payload)),
  });
  return result ? toUserSummary(result) : null;
}

export async function deleteUser(userId) {
  return apiRequest(`/api/users/${userId}`, {
    method: "DELETE",
  });
}
