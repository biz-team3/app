import {
  canViewerSeeUser,
  db,
  findUserById,
  findUserByUsername,
  getCurrentUser,
  getProfileImage,
  getViewerRelation,
} from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

function toProfile(user) {
  const viewer = getCurrentUser();
  const canViewContent = canViewerSeeUser(user, viewer);
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
    viewerRelation: getViewerRelation(user, viewer),
    canViewContent,
    isOwner: viewer.userId === user.userId,
  };
}

// TODO API: Spring Boot 연동 시 GET /api/profiles/me 로 교체
export async function getMyProfile() {
  return mockResponse(toProfile(getCurrentUser()));
}

// TODO API: Spring Boot 연동 시 GET /api/profiles/users/{userId} 로 교체
export async function getProfileByUserId(userId) {
  const user = findUserById(userId);
  if (!user) return mockError("User not found", 404);
  return mockResponse(toProfile(user));
}

// TODO API: Spring Boot 연동 시 GET /api/profiles/by-username/{username} 로 교체
export async function getProfileByUsername(username) {
  const user = findUserByUsername(username);
  if (!user) return mockError("User not found", 404);
  return mockResponse(toProfile(user));
}

// TODO API: Spring Boot 연동 시 GET /api/profiles/users/{userId}/posts?page={page}&size={size} 로 교체
export async function getProfilePosts(userId, { page = 0, size = 12 } = {}) {
  const user = findUserById(userId);
  if (!user) return mockError("User not found", 404);
  const canViewContent = canViewerSeeUser(user);
  const allPosts = canViewContent
    ? db.posts
        .filter((post) => post.authorId === Number(userId))
        .map((post) => ({
          postId: post.postId,
          imageUrl: post.media[0]?.url,
          mediaCount: post.media.length,
          hasMultipleMedia: post.media.length > 1,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
        }))
    : [];
  const start = page * size;
  const end = start + size;

  return mockResponse({
    userId: Number(userId),
    canViewContent,
    posts: allPosts.slice(start, end),
    page,
    size,
    totalElements: allPosts.length,
    totalPages: Math.ceil(allPosts.length / size),
    hasNext: end < allPosts.length,
  });
}

// TODO API: Spring Boot 연동 시 GET /api/profiles/users/{userId}/stories 로 교체
export async function getProfileStories(userId) {
  const user = findUserById(userId);
  if (!user) return mockError("User not found", 404);
  const canViewContent = canViewerSeeUser(user);
  const stories = canViewContent ? db.stories.filter((story) => story.userId === Number(userId)) : [];
  return mockResponse({ userId: Number(userId), canViewContent, stories });
}

// TODO API: Spring Boot 연동 시 PATCH /api/profiles/users/{userId} 로 교체
export async function updateProfile(userId, payload) {
  const user = findUserById(userId);
  const viewer = getCurrentUser();
  if (!user) return mockError("User not found", 404);
  if (user.userId !== viewer.userId) return mockError("Only the profile owner can change this profile", 403);
  const allowedFields = [
    "username",
    "name",
    "bio",
    "website",
    "accountVisibility",
    "profileImageUrl",
  ];
  const nextPayload = Object.fromEntries(Object.entries(payload).filter(([key]) => allowedFields.includes(key)));
  Object.assign(user, nextPayload);
  return mockResponse(toProfile(user));
}
