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
    accountVisibility,
  };
}

export async function getUsers({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const result = await apiRequest(`/api/user?${params.toString()}`);
  const pageRequest = result.pageRequest || { page, size };
  return {
    content: (result.content || []).map(toUserRecord),
    pageRequest,
    total: result.total ?? 0,
    totalPages: result.totalPages ?? 0,
    hasNext: Boolean(result.hasNext),
  };
}

export async function createUser(payload) {
  const result = await apiRequest("/api/user", {
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
  const result = await apiRequest(`/api/user/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(normalizeUserPayload(payload)),
  });
  return result ? toUserSummary(result) : null;
}

export async function deleteUser(userId) {
  return apiRequest(`/api/user/${userId}`, {
    method: "DELETE",
  });
}
