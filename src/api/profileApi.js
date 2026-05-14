import { apiRequest } from "./apiClient.js";

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

function normalizeProfilePost(post = {}) {
	return {
		postId: post.postId,
		imageUrl: post.imageUrl || "",
		mediaCount: post.mediaCount ?? 0,
		likeCount: post.likeCount ?? 0,
		commentCount: post.commentCount ?? 0,
	};
}

export async function getProfilePosts(userId, { page = 0, size = 12, type = "POSTS" } = {}) {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
		type,
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
