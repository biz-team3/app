import { canViewerSeeUser, db, findUserById, getCurrentUser, getProfileImage, nextId } from "../mocks/db.js";
import { extractHashtags } from "../utils/hashtags.js";
import { apiRequest, mockError, mockResponse } from "./mockClient.js";
import { createPageResponseFromItems } from "./pageResponse.js";

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
    createdAt: post.createdAt,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe: post.likedByUserIds.includes(viewer.userId),
    savedByMe: post.savedByUserIds.includes(viewer.userId),
    isOwner: author.userId === viewer.userId,
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
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiRequest(`/api/posts/feed?${params.toString()}`);
}

export async function getPostDetail(postId) {
  return apiRequest(`/api/posts/${postId}`, {
    method: "GET",
  });
}

export async function createPost(payload) {
  const caption = payload.caption?.trim() || "";

  await apiRequest("/api/posts", {
    method: "POST",
    body: JSON.stringify({
      media: (payload.media || []).map((item, index) => ({
        type: item.type || "IMAGE",
        url: item.url,
        sortOrder: item.sortOrder ?? index,
        originalFileName: item.originalFileName,
      })),
      caption,
      translatedCaption: payload.translatedCaption || caption,
    }),
  });

  return null;
}

export async function updatePostCaption(postId, payload) {
  const response = await apiRequest(`/api/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      caption: payload.caption,
      translatedCaption: payload.translatedCaption,
    }),
  });

  return null;
}

export async function replacePostMedia(postId, payload) {
  await apiRequest(`/api/posts/${postId}/media`, {
    method: "PUT",
    body: JSON.stringify({
      media: (payload.media || []).map((item, index) => ({
        mediaId: item.mediaId,
        type: item.type || "IMAGE",
        url: item.url,
        sortOrder: index,
        originalFileName: item.originalFileName || item.fileName || "unknown",
      })),
    }),
  });

  return null;
}

export async function deletePost(postId) {
  await apiRequest(`/api/posts/${postId}`, {
    method: "DELETE",
  });

  return null;
}

export async function likePost(postId) {
  await apiRequest(`/api/posts/${postId}/like`, {
    method: "POST",
  });

  return null;
}

export async function unlikePost(postId) {
  await apiRequest(`/api/posts/${postId}/like`, {
    method: "DELETE",
  });

  return null;
}

export async function savePost(postId) {
  await apiRequest(`/api/posts/${postId}/save`, {
    method: "POST",
    // body: JSON.stringify({}) //docs 빈요청 {}때문에 넣음
  });

  return null;
}

export async function unsavePost(postId) {
  await apiRequest(`/api/posts/${postId}/save`, {
    method: "DELETE",
  });

  return null;
}
