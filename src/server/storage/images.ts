import "server-only";
import sharp from "sharp";

/** Largest side, in pixels, that uploaded photos are scaled down to. */
const MAX_SIDE = 2048;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export class UploadError extends Error {}

/**
 * Checks an uploaded photo and turns it into a clean JPEG:
 * correct rotation from the phone's EXIF data, at most 2048 px, metadata removed.
 */
export async function normalizeUpload(file: File): Promise<{ data: Buffer; width: number; height: number }> {
  if (!ACCEPTED.has(file.type)) throw new UploadError("Please upload a JPG, PNG or WebP photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("That photo is larger than 12 MB. Please use a smaller one.");
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new UploadError("We couldn't read that photo. Please try another one.");
  }
}
