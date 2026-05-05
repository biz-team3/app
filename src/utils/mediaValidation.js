export const IMAGE_FILE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const MAX_POST_MEDIA_FILES = 10;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = IMAGE_FILE_ACCEPT.split(",");

export function validateImageFiles(files, { maxFiles = MAX_POST_MEDIA_FILES } = {}) {
  if (files.length > maxFiles) {
    return { ok: false, errorKey: "tooManyImages", params: { count: maxFiles } };
  }

  const unsupportedFile = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
  if (unsupportedFile) {
    return { ok: false, errorKey: "unsupportedImageType" };
  }

  const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
  if (oversizedFile) {
    return { ok: false, errorKey: "imageTooLarge", params: { size: "5MB" } };
  }

  return { ok: true };
}
