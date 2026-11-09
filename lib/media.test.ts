import { describe, expect, it } from "vitest";
import { MAX_MEDIA_FILE_SIZE, mediaTypeForFile } from "./media";

describe("mediaTypeForFile", () => {
  it("accepts supported audio formats including OGG and M4A", () => {
    expect(mediaTypeForFile({ type: "audio/ogg", size: 1 })).toBe("audio");
    expect(mediaTypeForFile({ type: "audio/x-m4a", size: 1 })).toBe("audio");
    expect(mediaTypeForFile({ type: "audio/mp4", size: 1 })).toBe("audio");
  });

  it("classifies supported photos and videos", () => {
    expect(mediaTypeForFile({ type: "image/jpeg", size: 1 })).toBe("image");
    expect(mediaTypeForFile({ type: "video/quicktime", size: 1 })).toBe("video");
  });

  it("rejects unsupported MIME types and files over the upload limit", () => {
    expect(mediaTypeForFile({ type: "audio/flac", size: 1 })).toBeNull();
    expect(mediaTypeForFile({ type: "audio/ogg", size: MAX_MEDIA_FILE_SIZE + 1 })).toBeNull();
  });
});
