import { canViewerSeeUser, db, findUserById, getCurrentUser, getProfileImage } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

function groupStories(userId, isMe = false) {
  const user = findUserById(userId);
  if (!user) return null;
  return {
    userId,
    username: user.username,
    profileImageUrl: getProfileImage(user),
    isMe,
    stories: db.stories.filter((story) => story.userId === userId),
  };
}

// TODO API: Spring Boot 연동 시 GET /api/stories/feed 로 교체
export async function getFeedStories() {
  const viewer = getCurrentUser();
  const ids = [viewer.userId, ...viewer.followingIds].filter((userId, index, arr) => arr.indexOf(userId) === index);
  return mockResponse({
    storyGroups: ids
      .filter((userId) => canViewerSeeUser(findUserById(userId)))
      .map((userId) => groupStories(userId, userId === viewer.userId))
      .filter((group) => group?.stories.length > 0),
  });
}

// TODO API: Spring Boot 연동 시 GET /api/stories/{userId} 로 교체
export async function getStoryBundle(userId) {
  const targetUser = findUserById(userId);
  if (!targetUser) return mockError("User not found", 404);
  if (!canViewerSeeUser(targetUser)) {
    return mockResponse({ ...groupStories(Number(userId), Number(userId) === getCurrentUser().userId), stories: [] });
  }
  return mockResponse(groupStories(Number(userId), Number(userId) === getCurrentUser().userId));
}
