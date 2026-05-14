import { apiRequest } from "./apiClient.js";

const STORY_ACTIVE_MS = 24 * 60 * 60 * 1000;

function toBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function isActiveStory(story) {
  const createdAt = new Date(story.createdAt).getTime();
  return !story.deletedAt && Number.isFinite(createdAt) && Date.now() - createdAt < STORY_ACTIVE_MS;
}

export function toStoryItem(story = {}) {
  return {
    storyId: story.storyId,
    imageUrl: story.imageUrl,
    createdAt: story.createdAt,
    isRead: toBoolean(story.isRead),
  };
}

export function toStoryGroup(group = {}) {
  const source = group || {};
  return {
    userId: source.userId,
    username: source.username,
    profileImageUrl: source.profileImageUrl,
    isOwner: toBoolean(source.isOwner ?? source.owner),
    stories: (source.stories || []).map(toStoryItem),
  };
}

export async function getFeedStories({ page = 0, size = 50 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const result = await apiRequest(`/api/stories/feed?${params.toString()}`, {
    method: "GET",
  });

  const content = (result.content || []).map(toStoryGroup);
  const pageRequest = result.pageRequest || { page, size };
  const total = result.total ?? content.length;

  return {
    content,
    pageRequest,
    total,
    totalPages: result.totalPages ?? (pageRequest.size ? Math.ceil(total / pageRequest.size) : 1),
    hasNext: Boolean(result.hasNext),
  };
}

export async function getStoryBundle(userId) {
  const result = await apiRequest(`/api/stories/${userId}`, {
    method: "GET",
  });
  return toStoryGroup(result);
}

export async function createStory(file) {
  if (!file) {
    throw Object.assign(new Error("Story image is required"), { status: 400 });
  }

  const formData = new FormData();
  formData.append("file", file);

  await apiRequest("/api/stories", {
    method: "POST",
    body: formData,
  });

  return null;
}

export async function markStoryAsRead(storyId) {
  await apiRequest(`/api/stories/view/${storyId}`, {
    method: "POST",
  });

  return null;
}

export async function deleteStory(storyId) {
  await apiRequest(`/api/stories/${storyId}`, {
    method: "DELETE",
  });

  return null;
}
