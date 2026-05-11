import { canViewerSeeUser, db, findUserById, getCurrentUser, getProfileImage, nextId } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

const STORY_ACTIVE_MS = 24 * 60 * 60 * 1000;

export function isActiveStory(story) {
  const createdAt = new Date(story.createdAt).getTime();
  return !story.deletedAt && Number.isFinite(createdAt) && Date.now() - createdAt < STORY_ACTIVE_MS;
}

export function toStoryItem(story) {
  const viewer = getCurrentUser();
  return {
    storyId: story.storyId,
    userId: story.userId,
    imageUrl: story.imageUrl,
    createdAt: story.createdAt,
    isOwner: story.userId === viewer.userId,
  };
}

function groupStories(userId) {
  const user = findUserById(userId);
  if (!user) return null;
  const viewer = getCurrentUser();
  return {
    userId,
    username: user.username,
    profileImageUrl: getProfileImage(user),
    isOwner: userId === viewer.userId,
    stories: db.stories
      .filter((story) => story.userId === userId)
      .filter(isActiveStory)
      .map(toStoryItem),
  };
}

// TODO API: Spring Boot 연동 시 GET /api/stories/feed 로 교체
export async function getFeedStories() {
  const viewer = getCurrentUser();
  const ids = [viewer.userId, ...viewer.followingIds].filter((userId, index, arr) => arr.indexOf(userId) === index);
  return mockResponse({
    storyGroups: ids
      .filter((userId) => canViewerSeeUser(findUserById(userId)))
      .map((userId) => groupStories(userId))
      .filter((group) => group && (group.isOwner || group.stories.length > 0)),
  });
}

// TODO API: Spring Boot 연동 시 GET /api/stories/{userId} 로 교체
export async function getStoryBundle(userId) {
  const targetUser = findUserById(userId);
  if (!targetUser) return mockError("User not found", 404);
  if (!canViewerSeeUser(targetUser)) {
    return mockResponse({ ...groupStories(Number(userId)), stories: [] });
  }
  return mockResponse(groupStories(Number(userId)));
}

// TODO API: Spring Boot 연동 시 POST /api/stories multipart/form-data 로 교체
export async function createStory(file) {
  if (!file) return mockError("Story image is required", 400);

  const viewer = getCurrentUser();
  const story = {
    storyId: nextId(db.stories, "storyId"),
    userId: viewer.userId,
    imageUrl: URL.createObjectURL(file),
    createdAt: new Date().toISOString(),
  };

  db.stories.unshift(story);
  return mockResponse(toStoryItem(story));
}

// TODO API: Spring Boot 연동 시 DELETE /api/stories/{storyId} 204 No Content로 교체
export async function deleteStory(storyId) {
  const story = db.stories.find((item) => item.storyId === Number(storyId));
  if (!story || story.deletedAt) return mockError("Story not found", 404);
  if (story.userId !== getCurrentUser().userId) return mockError("Only the story owner can delete this story", 403);

  story.deletedAt = new Date().toISOString();
  return mockResponse(null);
}
