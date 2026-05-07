import { db, findUserById, findUserByUsername, getCurrentUser, getProfileImage, nextId } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

const ACCOUNT_VISIBILITIES = ["PUBLIC", "PRIVATE"];

export function toUserSummary(user) {
  if (!user) return null;
  return {
    userId: user.userId,
    username: user.username,
    name: user.name,
    profileImageUrl: getProfileImage(user),
  };
}

function toUserRecord(user) {
  return {
    userId: user.userId,
    username: user.username,
    name: user.name,
    bio: user.bio,
    website: user.website,
    profileImageUrl: getProfileImage(user),
    followerCount: user.followerCount,
    followingCount: user.followingCount,
    postCount: db.posts.filter((post) => post.authorId === user.userId).length,
    accountVisibility: user.accountVisibility,
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

// TODO API: Spring Boot 연동 시 GET /api/users?page={page}&size={size}&q={query} 로 교체
export async function getUsers({ page = 0, size = 30, query = "" } = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  const users = db.users
    .filter((user) => {
      if (!normalizedQuery) return true;
      return (
        user.username.toLowerCase().includes(normalizedQuery) ||
        (user.name || "").toLowerCase().includes(normalizedQuery)
      );
    })
    .map(toUserRecord);
  const start = page * size;
  const end = start + size;

  return mockResponse({
    users: users.slice(start, end),
    page,
    size,
    totalElements: users.length,
    totalPages: Math.ceil(users.length / size),
    hasNext: end < users.length,
  });
}

// TODO API: Spring Boot 연동 시 POST /api/users 204 No Content로 교체
export async function createUser(payload) {
  let nextPayload;
  try {
    nextPayload = normalizeUserPayload(payload);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  if (!nextPayload.username) return mockError("username is required", 400);
  if (findUserByUsername(nextPayload.username)) return mockError("username already exists", 409);
  const user = {
    userId: nextId(db.users, "userId"),
    ...nextPayload,
    followerCount: 0,
    followingCount: 0,
    followingIds: [],
  };
  db.users.push(user);
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 GET /api/users/{userId} 로 교체
export async function getUserById(userId) {
  const user = findUserById(userId);
  if (!user) return mockError("User not found", 404);
  return mockResponse(toUserSummary(user));
}

// TODO API: Spring Boot 연동 시 GET /api/users/by-username/{username} 로 교체
export async function getUserByUsername(username) {
  const user = findUserByUsername(username);
  if (!user) return mockError("User not found", 404);
  return mockResponse(toUserSummary(user));
}

// TODO API: Spring Boot 연동 시 PATCH /api/users/{userId} 204 No Content로 교체
export async function updateUser(userId, payload) {
  const user = findUserById(userId);
  if (!user) return mockError("User not found", 404);
  if (payload.username && payload.username !== user.username && findUserByUsername(payload.username)) {
    return mockError("username already exists", 409);
  }
  const allowedFields = ["username", "name", "bio", "website", "profileImageUrl", "accountVisibility"];
  const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([key]) => allowedFields.includes(key)));
  let nextPayload;
  try {
    nextPayload = normalizeUserPayload({ ...user, ...filteredPayload });
  } catch (error) {
    return mockError(error.message, error.status);
  }
  Object.assign(user, nextPayload);
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 DELETE /api/users/{userId} 204 No Content로 교체
export async function deleteUser(userId) {
  const viewer = getCurrentUser();
  const targetUserId = Number(userId);
  if (targetUserId === viewer.userId) return mockError("Cannot delete the signed-in mock user", 400);
  if (db.posts.some((post) => post.authorId === targetUserId)) return mockError("Cannot delete a user with posts in mock data", 409);
  const index = db.users.findIndex((user) => user.userId === Number(userId));
  if (index < 0) return mockError("User not found", 404);
  if (index >= 0) db.users.splice(index, 1);
  db.users.forEach((user) => {
    user.followingIds = user.followingIds.filter((followingId) => followingId !== targetUserId);
  });
  db.followRequests = db.followRequests.filter(
    (request) => request.requesterId !== targetUserId && request.targetUserId !== targetUserId,
  );
  return mockResponse(null);
}
