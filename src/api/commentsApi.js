import { canViewerSeeUser, db, findUserById, getCurrentUser, nextId } from "../mocks/db.js";
import { mockError, mockResponse } from "./mockClient.js";
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

function ensureCommentOwner(commentId) {
  const comment = db.comments.find((item) => item.commentId === Number(commentId));
  if (!comment) throw Object.assign(new Error("Comment not found"), { status: 404 });
  ensurePostVisible(comment.postId);
  if (comment.authorId !== getCurrentUser().userId) throw Object.assign(new Error("Only the comment owner can change this comment"), { status: 403 });
  return comment;
}

function toComment(comment) {
  const author = findUserById(comment.authorId);
  const viewer = getCurrentUser();
  return {
    commentId: comment.commentId,
    postId: comment.postId,
    author: {
      userId: author.userId,
      username: author.username,
    },
    text: comment.text,
    createdAtText: comment.createdAtText,
    viewerPermissions: {
      canEdit: comment.authorId === viewer.userId,
      canDelete: comment.authorId === viewer.userId,
    },
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

// TODO API: Spring Boot 연동 시 POST /api/posts/{postId}/comments 204 No Content로 교체
export async function createComment(postId, payload) {
  try {
    ensurePostVisible(postId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  const comment = {
    commentId: nextId(db.comments, "commentId"),
    postId: Number(postId),
    authorId: getCurrentUser().userId,
    text: payload.text,
    createdAtText: "now",
  };
  db.comments.push(comment);
  const post = db.posts.find((item) => item.postId === Number(postId));
  if (post) post.commentCount += 1;
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 PATCH /api/comments/{commentId} 204 No Content로 교체
export async function updateComment(commentId, payload) {
  let comment;
  try {
    comment = ensureCommentOwner(commentId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  Object.assign(comment, payload);
  return mockResponse(null);
}

// TODO API: Spring Boot 연동 시 DELETE /api/comments/{commentId} 204 No Content로 교체
export async function deleteComment(commentId) {
  try {
    ensureCommentOwner(commentId);
  } catch (error) {
    return mockError(error.message, error.status);
  }
  const index = db.comments.findIndex((comment) => comment.commentId === Number(commentId));
  const [removed] = index >= 0 ? db.comments.splice(index, 1) : [];
  const post = removed && db.posts.find((item) => item.postId === removed.postId);
  if (post) post.commentCount = Math.max(0, post.commentCount - 1);
  return mockResponse(null);
}
