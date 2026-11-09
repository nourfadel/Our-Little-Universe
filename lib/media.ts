import type { MediaType } from "@/types/memory";

export const MAX_MEDIA_FILE_SIZE = 100 * 1024 * 1024;

export const MEDIA_FILE_ACCEPT = [
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/heic",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/wav", "audio/x-wav",
  "audio/webm", "audio/ogg", "audio/aac",
].join(",");

const MEDIA_TYPES: Record<string, MediaType> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/avif": "image",
  "image/heic": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/mp4": "audio",
  "audio/m4a": "audio",
  "audio/x-m4a": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/webm": "audio",
  "audio/ogg": "audio",
  "audio/aac": "audio",
};

export function mediaTypeForFile(file: { type: string; size: number }): MediaType | null {
  if (file.size < 0 || file.size > MAX_MEDIA_FILE_SIZE) return null;
  return MEDIA_TYPES[file.type] ?? null;
}
