import sharp from "sharp";

/** A small JPEG wrapped as a browser-style File, for upload tests. */
export async function fakePhoto(color = "#c98b62", name = "photo.jpg"): Promise<File> {
  const data = await sharp({ create: { width: 400, height: 400, channels: 3, background: color } }).jpeg().toBuffer();
  return new File([new Uint8Array(data)], name, { type: "image/jpeg" });
}
