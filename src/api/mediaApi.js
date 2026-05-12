import { apiRequest } from "./mockClient.js";

const uploadedMediaUrls = [
  "/oosu.hada.jpg",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
];

const uploadedProfileImageUrls = [
  "/oosu.hada.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/27.jpg",
  "https://images.unsplash.com/photo-1510227272981-87123e259b17?w=150&h=150&fit=crop",
];

export async function uploadPostMedia(files) {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });
  return await apiRequest("/api/posts/media", {
    method: "POST",
    body: formData,
  });
}

export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return await apiRequest("/api/user/media/profile-images", {
    method: "POST",
    body: formData,
  });
}
