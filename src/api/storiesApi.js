import { apiRequest } from "./mockClient.js";

const STORY_ACTIVE_MS = 24 * 60 * 60 * 1000;

export function isActiveStory(story) {
  const createdAt = new Date(story.createdAt).getTime();
  return !story.deletedAt && Number.isFinite(createdAt) && Date.now() - createdAt < STORY_ACTIVE_MS;
}

export function toStoryItem(story) {
  return {
    storyId: story.storyId,
    imageUrl: story.imageUrl,
    createdAt: story.createdAt,
  };
}

function toStoryGroup(group) {
  return {
    userId: group.userId,
    username: group.username,
    profileImageUrl: group.profileImageUrl,
    isOwner: Boolean(group.isOwner),
    stories: (group.stories || []).map(toStoryItem),
  };
}

export async function getFeedStories() {
  const result = await apiRequest("/api/stories/feed", {
    method: "GET",
  });
  return {
    storyGroups: (result.storyGroups || []).map(toStoryGroup),
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

export async function deleteStory(storyId) {
  await apiRequest(`/api/stories/${storyId}`, {
    method: "DELETE",
  });

  return null;
}
