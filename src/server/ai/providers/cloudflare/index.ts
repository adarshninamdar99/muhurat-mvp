import "server-only";
import sharp from "sharp";
import { env } from "@/server/env";
import { PRICE_USD } from "@/config/pricing";
import type { AiProvider, GeneratedClip, GeneratedFile, ReferenceImage, ShotRequest } from "../../types";

/**
 * FREE real-AI provider: Cloudflare Workers AI, FLUX.2 [klein] 4B.
 *
 * Why this model: it runs on Cloudflare's free plan (10,000 "neurons" a day,
 * no credit card) and accepts up to 4 reference images, so the couple's faces,
 * the venue and the anchor shot can all guide each picture.
 *
 * Limits of the free route:
 *   - about 80 pictures a day (resets 5:30 am IST); after that calls fail with a clear message
 *   - each reference image must be smaller than 512×512, so we shrink them first
 *   - no depth model or video model is used here: depth uses a labelled stand-in and
 *     clips use the in-browser camera-move preview and the Wedding film feature
 *
 * API reference: https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/
 */

export const CLOUDFLARE_IMAGE_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const OUTPUT = { width: 1024, height: 576 }; // 16:9, 4 output tiles
const REQUEST_TIMEOUT_MS = 90_000;

/** Today's free allowance is spent. Trying again now would fail too, so the job queue does not retry it. */
export class AllowanceUsedUpError extends Error {
  readonly retryable = false;
}

function endpoint(model: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;
}

/** Shrinks a reference image to fit inside 511×511, as the model requires. */
async function toReference(ref: ReferenceImage): Promise<Blob> {
  const small = await sharp(ref.data).resize(511, 511, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  return new Blob([new Uint8Array(small)], { type: "image/jpeg" });
}

/** Reads either a raw image response or Cloudflare's JSON envelope { result: { image: base64 } }. */
async function readImage(res: Response): Promise<Buffer> {
  const type = res.headers.get("content-type") ?? "";
  if (type.startsWith("image/")) return Buffer.from(await res.arrayBuffer());
  const body = (await res.json()) as { result?: { image?: string }; image?: string };
  const b64 = body.result?.image ?? body.image;
  if (!b64) throw new Error("Cloudflare returned no image");
  return Buffer.from(b64, "base64");
}

async function explainError(res: Response): Promise<Error> {
  const text = await res.text();
  // Cloudflare reports an exhausted free allowance with code 4006 / "neurons".
  if (res.status === 429 || /4006|neuron|allocation|quota/i.test(text)) {
    return new AllowanceUsedUpError("Today's free AI allowance is used up. It resets at 5:30 am IST.");
  }
  if (res.status === 401 || res.status === 403) return new Error("Cloudflare rejected the API token. Check CLOUDFLARE_API_TOKEN.");
  return new Error(`Cloudflare Workers AI error (HTTP ${res.status}): ${text.slice(0, 300)}`);
}

async function stillOnly(photo: ReferenceImage): Promise<GeneratedFile> {
  // Honest stand-in: Cloudflare has no depth model on the free plan.
  const data = await sharp(photo.data).greyscale().blur(12).normalise().png().toBuffer();
  return { data, ext: "png", model: "stand-in/depth", costUsd: 0 };
}

export const cloudflareProvider: AiProvider = {
  name: "cloudflare",
  maxReferences: 4,
  referenceIndexBase: 0,
  capabilities: { realPictures: true, realDepth: false, realVideo: false },

  analyzeVenue: ({ photo }) => stillOnly(photo),

  async generateShot(req: ShotRequest): Promise<GeneratedFile> {
    const form = new FormData();
    form.append("prompt", req.prompt);
    form.append("width", String(OUTPUT.width));
    form.append("height", String(OUTPUT.height));
    const refs = req.references.slice(0, 4);
    for (const [i, ref] of refs.entries()) form.append(`input_image_${i}`, await toReference(ref), `ref${i}.jpg`);

    const res = await fetch(endpoint(CLOUDFLARE_IMAGE_MODEL), {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      body: form,
      // A stuck request should fail (and be retried once) rather than keep the couple waiting.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw await explainError(res);
    const raw = await readImage(res);
    const data = await sharp(raw).jpeg({ quality: 90 }).toBuffer();
    return { data, ext: "jpg", model: CLOUDFLARE_IMAGE_MODEL, costUsd: PRICE_USD.cloudflareFree };
  },

  async generateClip(): Promise<GeneratedClip> {
    return { kind: "preview", model: "browser/camera-move", costUsd: 0 };
  },
};
