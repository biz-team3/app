import { db, findUserById, findUserByUsername, getCurrentUser, getProfileImage, nextId } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

export function toUserSummary(user) {
  if (!user) return null;
  return {
    userId: user.userId,
    username: user.username,
    name: user.name,
    profileImageUrl: getProfileImage(user),
  };
}

// TODO API: Spring Boot 연동 시 POST /api/users 로 교체
export async function createUser(payload) {
  if (!payload.username) return mockError("username is required", 400);
  if (findUserByUsername(payload.username)) return mockError("username already exists", 409);
  const user = {
    userId: nextId(db.users, "userId"),
    username: payload.username,
    name: payload.name || payload.username,
    bio: payload.bio || "",
    website: payload.website || "",
    profileImageUrls: payload.profileImageUrls || [],
    currentProfileImageIndex: 0,
    followerCount: 0,
    followingCount: 0,
    followingIds: [],
    accountVisibility: payload.accountVisibility || "PUBLIC",
  };
  db.users.push(user);
  return mockResponse(toUserSummary(user));
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

// TODO API: Spring Boot 연동 시 PATCH /api/users/{userId} 로 교체
export async function updateUser(userId, payload) {
  const user = findUserById(userId);
  const viewer = getCurrentUser();
  if (!user) return mockError("User not found", 404);
  if (user.userId !== viewer.userId) return mockError("Only the user owner can change this user", 403);
  if (payload.username && payload.username !== user.username && findUserByUsername(payload.username)) {
    return mockError("username already exists", 409);
  }
  const allowedFields = ["username", "name", "bio", "website", "accountVisibility"];
  const nextPayload = Object.fromEntries(Object.entries(payload).filter(([key]) => allowedFields.includes(key)));
  Object.assign(user, nextPayload);
  return mockResponse(toUserSummary(user));
}

// TODO API: Spring Boot 연동 시 DELETE /api/users/{userId} 로 교체
export async function deleteUser(userId) {
  const viewer = getCurrentUser();
  if (Number(userId) !== viewer.userId) return mockError("Only the user owner can delete this user", 403);
  const index = db.users.findIndex((user) => user.userId === Number(userId));
  if (index < 0) return mockError("User not found", 404);
  if (index >= 0) db.users.splice(index, 1);
  return mockResponse({ userId: Number(userId), deleted: true });
}
