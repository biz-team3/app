import { canViewerSeeUser, db, findUserById, getCurrentUser, getProfileImage, nextId } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";

function extractHashtags(text = "") {
  return Array.from(new Set(text.match(/#[^\s#]+/g) || []));
}

function toMediaItem(item, postId, index) {
  const rawUrl = item.previewUrl || item.url || "";
  const isInlineData = rawUrl.startsWith("data:");

  return {
    mediaId: postId * 100 + index + 1,
    type: item.type || "IMAGE",
    url: isInlineData ? "/oosu.hada.jpg" : rawUrl,
    sortOrder: index,
    temporary: Boolean(item.previewUrl || item.fileName || isInlineData),
    originalFileName: item.fileName || "",
  };
}

function toFeedPost(post) {
  const viewer = getCurrentUser();
  const author = findUserById(post.authorId);

  return {
    postId: post.postId,
    author: {
      userId: author.userId,
      username: author.username,
      profileImageUrl: getProfileImage(author),
    },
    media: post.media,
    caption: post.caption,
    translatedCaption: post.translatedCaption,
    hashtags: post.hashtags || extractHashtags(post.caption),
    createdAtText: post.createdAtText,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe: post.likedByUserIds.includes(viewer.userId),
    savedByMe: post.savedByUserIds.includes(viewer.userId),
    suggested: post.suggested,
    viewerPermissions: {
      canEdit: author.userId === viewer.userId,
      canDelete: author.userId === viewer.userId,
    },
  };
}

function findPost(postId) {
  return db.posts.find((post) => post.postId === Number(postId));
}

function canViewerSeePost(post) {
  return Boolean(post && canViewerSeeUser(findUserById(post.authorId)));
}

function ensurePostVisible(postId) {
  const post = findPost(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  if (!canViewerSeePost(post)) throw Object.assign(new Error("Post is not visible to current user"), { status: 403 });
  return post;
}

function ensurePostOwner(postId) {
  const post = findPost(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  if (post.authorId !== getCurrentUser().userId) throw Object.assign(new Error("Only the post owner can change this post"), { status: 403 });
  return post;
}

// TODO API: Spring Boot 연동 시 GET /api/posts/feed?page={page}&size={size} 로 교체
export async function getFeedPosts({ page = 0, size = 10 } = {}) {
  const start = page * size;
  const end = start + size;
  const visiblePosts = db.posts.filter((post) => canViewerSeeUser(findUserById(post.authorId)));
  const posts = visiblePosts.slice(start, end).map(toFeedPost);

  return mockResponse({
    posts,
    page,
    size,
    totalElements: visiblePosts.length,
    totalPages: Math.ceil(visiblePosts.length / size),
    hasNext: end < visiblePosts.length,
  });
}

// TODO API: Spring Boot 연동 시 GET /api/posts/{postId} 로 교체
export async function getPostDetail(postId) {
  try {
    return mockResponse(toFeedPost(ensurePostVisible(postId)));
  } catch (error) {
    return mockError(error.message, error.status);
  }
}

// TODO API: Spring Boot 연동 시 POST /api/posts 204 No Content로 교체
export async function createPost(payload) {
  const caption = payload.caption?.trim() || "";

  await apiRequest("/api/posts", {
    method: "POST",
    body: JSON.stringify({
      media: (payload.media || []).map((item, index) => ({
        type: item.type || "IMAGE",
        url: item.url,
        sortOrder: item.sortOrder ?? index,
        originalFileName: item.originalFileName || item.fileName || "",
      })),
      caption,
      translatedCaption: payload.translatedCaption || caption,
    }),
  });

  return null;
}

// TODO API: Spring Boot 연동 시 PATCH /api/posts/{postId} 204 No Content로 교체
export async function updatePostCaption(postId, payload) {
  let post;
  try {
    post = ensurePostOwner(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  const caption = payload.caption ?? post.caption;
  Object.assign(post, {
    caption,
    translatedCaption: payload.translatedCaption || caption,
    hashtags: payload.hashtags?.length ? payload.hashtags : extractHashtags(caption),
  });
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 PUT /api/posts/{postId}/media 204 No Content로 교체
export async function replacePostMedia(postId, payload) {
  let post;
  try {
    post = ensurePostOwner(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  post.media = (payload.media || []).map((item, index) => toMediaItem(item, post.postId, index));
  return mockResponse(null);
}

export async function updatePost(postId, payload) {
  let result = await updatePostCaption(postId, payload);
  if (payload.media) result = await replacePostMedia(postId, { media: payload.media });
  return result;
}

// TODO API: Spring Boot 연동 시 DELETE /api/posts/{postId} 204 No Content로 교체
export async function deletePost(postId) {
  try {
    ensurePostOwner(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  const index = db.posts.findIndex((post) => post.postId === Number(postId));
  if (index >= 0) db.posts.splice(index, 1);
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 POST /api/posts/{postId}/like 204 No Content로 교체
export async function likePost(postId) {
  const viewer = getCurrentUser();
  let post;
  try {
    post = ensurePostVisible(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  if (!post.likedByUserIds.includes(viewer.userId)) {
    post.likedByUserIds.push(viewer.userId);
    post.likeCount += 1;
  }
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 DELETE /api/posts/{postId}/like 204 No Content로 교체
export async function unlikePost(postId) {
  const viewer = getCurrentUser();
  let post;
  try {
    post = ensurePostVisible(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  post.likedByUserIds = post.likedByUserIds.filter((userId) => userId !== viewer.userId);
  post.likeCount = Math.max(0, post.likeCount - 1);
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 POST /api/posts/{postId}/save 204 No Content로 교체
export async function savePost(postId) {
  const viewer = getCurrentUser();
  let post;
  try {
    post = ensurePostVisible(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  if (!post.savedByUserIds.includes(viewer.userId)) {
    post.savedByUserIds.push(viewer.userId);
  }
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 DELETE /api/posts/{postId}/save 204 No Content로 교체
export async function unsavePost(postId) {
  const viewer = getCurrentUser();
  let post;
  try {
    post = ensurePostVisible(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  post.savedByUserIds = post.savedByUserIds.filter((userId) => userId !== viewer.userId);
  return mockResponse(null);
}
