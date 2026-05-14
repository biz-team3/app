import { apiRequest } from "./apiClient.js";

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
    }),
  });

  return null;
}

export async function updatePostCaption(postId, payload) {
  await apiRequest(`/api/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      caption: payload.caption,
    }),
  });

  return null;
}

export async function translatePostCaption(postId) {
  return apiRequest("/api/translations", {
    method: "POST",
    body: JSON.stringify({
      targetType: "POST",
      targetId: postId,
    }),
  });
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
