import "server-only";
import sharp from "sharp";
import { PRICE_USD } from "@/config/pricing";
import type { AiProvider, GeneratedClip, GeneratedFile, ReferenceImage, ShotRequest } from "../../types";
import { renderStoryboardSvg } from "./storyboard";

/**
 * Demo provider: free, offline, no account needed.
 *   - pictures: a storyboard sketch drawn from the couple's choices, with
 *     their uploaded faces placed on the figures
 *   - venue depth: a blurred greyscale stand-in (clearly not real depth)
 *   - clips: no file; the screen animates the still with the chosen camera move
 * A short pause imitates the real waiting time so the screens behave the same.
 */

const DEMO_DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 900);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function faceDataUri(ref: ReferenceImage | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  const small = await sharp(ref.data).resize(256, 256, { fit: "cover", position: "attention" }).jpeg({ quality: 80 }).toBuffer();
  return `data:image/jpeg;base64,${small.toString("base64")}`;
}

async function venueDataUri(ref: ReferenceImage | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  const small = await sharp(ref.data).resize(1600, 900, { fit: "cover" }).jpeg({ quality: 75 }).toBuffer();
  return `data:image/jpeg;base64,${small.toString("base64")}`;
}

export const mockProvider: AiProvider = {
  name: "mock",

  async analyzeVenue({ photo }): Promise<GeneratedFile> {
    await pause(DEMO_DELAY_MS);
    const data = await sharp(photo.data).greyscale().blur(12).normalise().png().toBuffer();
    return { data, ext: "png", model: "mock/depth", costUsd: PRICE_USD.mock };
  },

  async generateShot(req: ShotRequest): Promise<GeneratedFile> {
    await pause(DEMO_DELAY_MS);
    const brideRef = req.references.find((r) => r.label.startsWith("the bride,"));
    const groomRef = req.references.find((r) => r.label.startsWith("the groom,"));
    const venueRef = req.references.find((r) => r.label === "the wedding venue");
    const svg = renderStoryboardSvg(req.scene, {
      bride: await faceDataUri(brideRef),
      groom: await faceDataUri(groomRef),
      venue: await venueDataUri(venueRef),
    });
    const data = await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
    return { data, ext: "jpg", model: "mock/storyboard", costUsd: PRICE_USD.mock };
  },

  async generateClip(): Promise<GeneratedClip> {
    await pause(DEMO_DELAY_MS * 2);
    return { kind: "preview", model: "mock/preview", costUsd: PRICE_USD.mock };
  },
};
