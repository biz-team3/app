import { db, findPendingFollowRequest, findUserById, getCurrentUser, getProfileImage, getViewerRelation, nextId } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

function toFollowUser(user) {
  const viewer = getCurrentUser();
  return {
    userId: user.userId,
    username: user.username,
    name: user.name,
    profileImageUrl: getProfileImage(user),
    viewerRelation: getViewerRelation(user, viewer),
    isViewer: user.userId === viewer.userId,
  };
}

function filterUsers(users, query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return users;
  return users.filter(
    (user) =>
      user.username.toLowerCase().includes(normalizedQuery) ||
      user.name.toLowerCase().includes(normalizedQuery),
  );
}

function paginate(users, page, size) {
  const start = page * size;
  const end = start + size;

  return {
    users: users.slice(start, end),
    page,
    size,
    totalElements: users.length,
    totalPages: Math.ceil(users.length / size),
    hasNext: end < users.length,
  };
}

// TODO API: Spring Boot 연동 시 GET /api/users/{userId}/followers?page={page}&size={size}&q={query} 로 교체
export async function getFollowers(userId, { page = 0, size = 20, query = "" } = {}) {
  const targetUserId = Number(userId);
  if (!findUserById(targetUserId)) return mockError("User not found", 404);
  const users = filterUsers(db.users.filter((user) => user.followingIds.includes(targetUserId)).map(toFollowUser), query);
  return mockResponse({ userId: targetUserId, ...paginate(users, page, size) });
}

// TODO API: Spring Boot 연동 시 GET /api/users/{userId}/following?page={page}&size={size}&q={query} 로 교체
export async function getFollowing(userId, { page = 0, size = 20, query = "" } = {}) {
  const targetUser = findUserById(userId);
  if (!targetUser) return mockError("User not found", 404);
  const users = filterUsers(targetUser.followingIds.map((followingId) => findUserById(followingId)).filter(Boolean).map(toFollowUser), query);
  return mockResponse({ userId: Number(userId), ...paginate(users, page, size) });
}

// TODO API: Spring Boot 연동 시 POST /api/follows/{targetUserId} 204 No Content로 교체
export async function followUser(targetUserId) {
  const viewer = getCurrentUser();
  const targetUser = findUserById(targetUserId);
  if (!targetUser) return mockError("User not found", 404);
  if (targetUser.userId === viewer.userId) return mockError("Cannot follow yourself", 400);

  if (targetUser.accountVisibility === "PRIVATE") {
    if (!viewer.followingIds.includes(targetUser.userId) && !findPendingFollowRequest(viewer.userId, targetUser.userId)) {
      db.followRequests.push({
        requestId: nextId(db.followRequests, "requestId"),
        requesterId: viewer.userId,
        targetUserId: targetUser.userId,
        status: "PENDING",
        username: viewer.username,
        mutualText: "",
        imageUrl: getProfileImage(viewer),
      });
    }
    return mockResponse(null);
  }

  if (!viewer.followingIds.includes(targetUser.userId)) {
    viewer.followingIds.push(targetUser.userId);
    viewer.followingCount += 1;
    targetUser.followerCount += 1;
  }
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 DELETE /api/follows/{targetUserId} 204 No Content로 교체
export async function unfollowUser(targetUserId) {
  const viewer = getCurrentUser();
  const targetUser = findUserById(targetUserId);
  if (!targetUser) return mockError("User not found", 404);
  if (targetUser.userId === viewer.userId) return mockError("Cannot unfollow yourself", 400);
  db.followRequests = db.followRequests.filter(
    (request) => !(request.requesterId === viewer.userId && request.targetUserId === targetUser.userId && request.status === "PENDING"),
  );
  const wasFollowing = viewer.followingIds.includes(targetUser.userId);
  viewer.followingIds = viewer.followingIds.filter((userId) => userId !== targetUser.userId);
  if (wasFollowing) {
    viewer.followingCount = Math.max(0, viewer.followingCount - 1);
    targetUser.followerCount = Math.max(0, targetUser.followerCount - 1);
  }
  return mockResponse(null);
}
