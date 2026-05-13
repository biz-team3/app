import {
	db,
	getCurrentUser,
	getProfileImage,
} from "../mocks/db.js";
import { getFollowers, getFollowing } from "./followsApi.js";
import { apiRequest, mockError } from "./mockClient.js";

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

async function getMutualFollowerSummary(userId) {
	const viewer = getCurrentUser();
	if (viewer.userId === Number(userId)) {
		return {
			mutualFollowerName: null,
			mutualFollowerCount: 0,
		};
	}

	const [viewerFollowingResult, targetFollowersResult] = await Promise.all([
		getFollowing(viewer.userId, { page: 0, size: USER_PAGE_SIZE }),
		getFollowers(userId, { page: 0, size: USER_PAGE_SIZE }),
	]);

	const viewerFollowingIds = new Set((viewerFollowingResult.content || []).map((user) => Number(user.userId)));
	const mutualFollowers = (targetFollowersResult.content || []).filter((user) => viewerFollowingIds.has(Number(user.userId)));

	return {
		mutualFollowerName: mutualFollowers[0]?.username || null,
		mutualFollowerCount: mutualFollowers.length,
	};
}

async function toProfile(user) {
	const normalized = normalizeUser(user);
	const viewer = getCurrentUser();
	const [followerCount, followingCount, viewerRelation, mutualFollowerSummary] = await Promise.all([
		countFollowList(getFollowers, normalized.userId),
		countFollowList(getFollowing, normalized.userId),
		getViewerRelation(normalized.userId),
		getMutualFollowerSummary(normalized.userId),
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
		...mutualFollowerSummary,
	};
}

export async function getMyProfile() {
	const viewer = getCurrentUser();
	const user = await findApiUserById(viewer.userId);
	if (!user) return mockError("User not found", 404);
	return toProfile(user);
}

export async function getProfileByUserId(userId) {
	const user = await findApiUserById(userId);
	if (!user) return mockError("User not found", 404);
	return toProfile(user);
}

export async function getProfileByUsername(username) {
	const user = await findApiUserByUsername(username);
	if (!user) return mockError("User not found", 404);
	return toProfile(user);
}

function normalizeProfilePost(post = {}) {
	return {
		postId: post.postId,
		imageUrl: post.imageUrl || "",
		mediaCount: post.mediaCount ?? 0,
		likeCount: post.likeCount ?? 0,
		commentCount: post.commentCount ?? 0,
	};
}

export async function getProfilePosts(userId, { page = 0, size = 12 } = {}) {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});
	const result = await apiRequest(`/api/profiles/users/${userId}/posts?${params.toString()}`);
	const pageRequest = result.pageRequest || { page, size };
	return {
		content: (result.content || []).map(normalizeProfilePost),
		pageRequest,
		total: result.total ?? 0,
		totalPages: result.totalPages ?? 0,
		hasNext: Boolean(result.hasNext),
	};
}

export async function updateProfile(userId, payload) {
	const viewer = getCurrentUser();
	if (Number(userId) !== viewer.userId) return mockError("Only the profile owner can change this profile", 403);
	await apiRequest(`/api/user/${userId}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
	return getProfileByUserId(userId);
}
