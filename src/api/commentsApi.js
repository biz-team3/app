import { canViewerSeeUser, db, findUserById, getCurrentUser } from "../mocks/db.js";
import { apiRequest, mockError, mockResponse } from "./mockClient.js";
import { createPageResponseFromItems } from "./pageResponse.js";

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

function toComment(comment) {
  const author = comment.author || findUserById(comment.authorId);
  const viewer = getCurrentUser();
  return {
    commentId: comment.commentId,
    postId: comment.postId,
    author: {
      userId: author.userId,
      username: author.username,
    },
    text: comment.text,
    createdAt: comment.createdAt,
    isOwner: comment.isOwner ?? (author.userId === viewer.userId),
  };
}

// TODO API: Spring Boot 연동 시 GET /api/posts/{postId}/comments?page={page}&size={size} 로 교체
export async function getPostComments(postId, { page = 0, size = 20 } = {}) {
  try {
    ensurePostVisible(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  const allComments = db.comments.filter((comment) => comment.postId === Number(postId));
  return mockResponse(createPageResponseFromItems(allComments, { page, size, mapItem: toComment }));
}

export async function createComment(postId, payload) {
  const result = await apiRequest(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result ? toComment(result) : null;
}

export async function updateComment(commentId, payload) {
  const result = await apiRequest(`/api/posts/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return result ? toComment(result) : null;
}

export async function deleteComment(commentId) {
  const result = await apiRequest(`/api/posts/comments/${commentId}`, {
    method: "DELETE",
  });
  return result ? toComment(result) : null;
}
