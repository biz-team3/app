import { mockResponse } from "./mockClient.js";

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

// TODO API: Spring Boot 연동 시 POST /api/media/posts multipart/form-data 로 교체
export async function uploadPostMedia(files) {
  return mockResponse({
    media: files.map((file, index) => ({
      type: "IMAGE",
      url: uploadedMediaUrls[index % uploadedMediaUrls.length],
      sortOrder: index,
      originalFileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    })),
  });
}

// TODO API: Spring Boot 연동 시 POST /api/media/profile-images multipart/form-data 로 교체
export async function uploadProfileImage(file) {
  const index = Math.abs((file?.name || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), Date.now())) % uploadedProfileImageUrls.length;
  return mockResponse({
    imageUrl: uploadedProfileImageUrls[index],
    originalFileName: file?.name || "",
    contentType: file?.type || "",
    fileSize: file?.size || 0,
  });
}
