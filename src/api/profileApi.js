import {
	canViewerSeeUser,
	db,
	findUserById,
	getCurrentUser,
	getProfileImage,
} from "../mocks/db.js";
import { getFollowers, getFollowing } from "./followsApi.js";
import { apiRequest, mockError, mockResponse } from "./mockClient.js";
import { createPageResponseFromItems } from "./pageResponse.js";

const USER_PAGE_SIZE = 1000;

function normalizeUser(user) {
	if (!user) return null;
	return {
		userId: user.userId,
		username: user.username,
		name: user.name,
		bio: user.bio || "",
		website: user.website || "",
		profileImageUrl: user.profileImageUrl || user.profileImg || getProfileImage(user),
		accountVisibility: user.accountVisibility || user.accountVis || "PUBLIC",
	};
}

async function getUsersPage() {
	return apiRequest(`/api/user?page=0&size=${USER_PAGE_SIZE}`);
}

async function findApiUserById(userId) {
	const result = await getUsersPage();
	return (result.content || []).map(normalizeUser).find((user) => user.userId === Number(userId));
}

async function findApiUserByUsername(username) {
	const result = await getUsersPage();
	return (result.content || []).map(normalizeUser).find((user) => user.username === username);
}

async function countFollowList(loader, userId) {
	const result = await loader(userId, { page: 0, size: 1 });
	return result.total ?? result.content?.length ?? 0;
}

async function getViewerRelation(userId) {
	const viewer = getCurrentUser();
	if (viewer.userId === Number(userId)) return "SELF";

	const following = await getFollowing(viewer.userId, { page: 0, size: USER_PAGE_SIZE });
	const isFollowing = (following.content || []).some((user) => user.userId === Number(userId));
	return isFollowing ? "FOLLOWING" : "NOT_FOLLOWING";
}

async function toProfile(user) {
	const normalized = normalizeUser(user);
	const viewer = getCurrentUser();
	const [followerCount, followingCount, viewerRelation] = await Promise.all([
		countFollowList(getFollowers, normalized.userId),
		countFollowList(getFollowing, normalized.userId),
		getViewerRelation(normalized.userId),
	]);
	const canViewContent = normalized.accountVisibility === "PUBLIC" || viewerRelation === "SELF" || viewerRelation === "FOLLOWING";

	return {
		...normalized,
		followerCount,
		followingCount,
		postCount: db.posts.filter((post) => post.authorId === normalized.userId).length,
		viewerRelation,
		canViewContent,
		isOwner: viewer.userId === normalized.userId,
	};
}

function toProfileFromApi(profile = {}) {
	return {
		userId: profile.userId,
		username: profile.username,
		name: profile.name,
		bio: profile.bio || "",
		website: profile.website || "",
		profileImageUrl: profile.profileImageUrl || "",
		followerCount: profile.followerCount ?? 0,
		followingCount: profile.followingCount ?? 0,
		postCount: profile.postCount ?? 0,
		accountVisibility: profile.accountVisibility || "PUBLIC",
		viewerRelation: profile.viewerRelation || "NOT_FOLLOWING",
		canViewContent: profile.canViewContent ?? false,
		isOwner: profile.isOwner ?? false,
	};
}

export async function getMyProfile() {
	const result = await apiRequest("/api/profiles/me");
	return toProfileFromApi(result);
}

export async function getProfileByUserId(userId) {
	const result = await apiRequest(`/api/profiles/${userId}`);
	return toProfileFromApi(result);
}

export async function getProfileByUsername(username) {
	const result = await apiRequest(`/api/profiles/by-username/${encodeURIComponent(username)}`);
	return toProfileFromApi(result);
}

// TODO API: 게시물 목록 조회 API가 준비되면 Spring Boot 프로필 게시물 API로 교체
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
	return mockResponse(createPageResponseFromItems(allPosts, { page, size }));
}

export async function updateProfile(userId, payload) {
	const result = await apiRequest(`/api/profiles/users/${userId}`, {
		method: "PATCH",
		body: JSON.stringify({
			username: payload.username?.trim(),
			name: payload.name?.trim(),
			bio: payload.bio || "",
			website: payload.website || "",
			accountVisibility: payload.accountVisibility,
			profileImageUrl: payload.profileImageUrl || "",
		}),
	});

	return toProfileFromApi(result);
}
