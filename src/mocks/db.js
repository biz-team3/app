import { postsMock, commentsMock } from "./posts.mock.js";
import { usersMock, storiesMock } from "./users.mock.js";
import { followRequestsMock, notificationsMock } from "./notifications.mock.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

export const db = {
  users: clone(usersMock),
  posts: clone(postsMock),
  comments: clone(commentsMock),
  stories: clone(storiesMock),
  notifications: clone(notificationsMock),
  followRequests: clone(followRequestsMock),
};

export const currentUserId = 1;

export function nextId(collection, key) {
  return Math.max(0, ...collection.map((item) => Number(item[key]) || 0)) + 1;
}

export function findUserById(userId) {
  return db.users.find((user) => user.userId === Number(userId));
}

export function findUserByUsername(username) {
  return db.users.find((user) => user.username === username);
}

export function getCurrentUser() {
  return findUserById(currentUserId);
}

export function getProfileImage(user) {
  return user?.profileImageUrls?.[user.currentProfileImageIndex || 0] || user?.profileImageUrls?.[0] || "";
}

export function canViewerSeeUser(targetUser, viewer = getCurrentUser()) {
  if (!targetUser || !viewer) return false;
  if (targetUser.userId === viewer.userId) return true;
  if (targetUser.accountVisibility === "PUBLIC") return true;
  return viewer.followingIds.includes(targetUser.userId);
}

export function findPendingFollowRequest(requesterId, targetUserId) {
  return db.followRequests.find(
    (request) =>
      request.requesterId === Number(requesterId) &&
      request.targetUserId === Number(targetUserId) &&
      request.status === "PENDING",
  );
}

export function getViewerRelation(targetUser, viewer = getCurrentUser()) {
  if (!targetUser || !viewer) return "NOT_FOLLOWING";
  if (targetUser.userId === viewer.userId) return "OWNER";
  if (viewer.followingIds.includes(targetUser.userId)) return "FOLLOWING";
  if (findPendingFollowRequest(viewer.userId, targetUser.userId)) return "PENDING";
  return "NOT_FOLLOWING";
}
