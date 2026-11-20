import "server-only";
import { fal } from "@fal-ai/client";
import { z } from "zod";
import { env } from "@/server/env";
import { PRICE_USD } from "@/config/pricing";
import type { AiProvider, ClipRequest, GeneratedClip, GeneratedFile, ReferenceImage, ShotRequest } from "../../types";
import { FAL_MODELS } from "./models";

/**
 * Real AI provider on fal.ai.
 *
 * Flow for every call:
 *   1. upload reference images to fal storage (returns temporary URLs)
 *   2. run the model with fal.subscribe (waits in fal's queue until done)
 *   3. download the result so we keep our own copy
 */

fal.config({ credentials: env.FAL_KEY });

const fileSchema = z.object({ url: z.string().url() });
const imageResult = z.object({ images: z.array(fileSchema).min(1) });
const depthResult = z.object({ image: fileSchema });
const videoResult = z.object({ video: fileSchema });

async function upload(ref: ReferenceImage): Promise<string> {
  const blob = new Blob([new Uint8Array(ref.data)], { type: ref.contentType });
  return fal.storage.upload(blob);
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download the result from fal.ai (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/** Runs a model and checks the response has the shape we expect. */
async function run<T>(model: string, input: Record<string, unknown>, shape: z.ZodType<T>): Promise<T> {
  const result = await fal.subscribe(model, { input, logs: false });
  const parsed = shape.safeParse(result.data);
  if (!parsed.success) throw new Error(`Unexpected response from ${model}: ${parsed.error.message}`);
  return parsed.data;
}

export const falProvider: AiProvider = {
  name: "fal",

  async analyzeVenue({ photo }): Promise<GeneratedFile> {
    const imageUrl = await upload(photo);
    const out = await run(FAL_MODELS.depth, { image_url: imageUrl }, depthResult);
    return { data: await download(out.image.url), ext: "png", model: FAL_MODELS.depth, costUsd: PRICE_USD.depth };
  },

  async generateShot(req: ShotRequest): Promise<GeneratedFile> {
    const imageUrls = await Promise.all(req.references.map(upload));
    const out = await run(
      FAL_MODELS.image,
      {
        prompt: req.prompt,
        image_urls: imageUrls,
        num_images: 1,
        aspect_ratio: "16:9",
        output_format: "jpeg",
      },
      imageResult,
    );
    return { data: await download(out.images[0]!.url), ext: "jpg", model: FAL_MODELS.image, costUsd: PRICE_USD.image };
  },

  async generateClip(req: ClipRequest): Promise<GeneratedClip> {
    const imageUrl = await upload(req.still);
    const out = await run(
      FAL_MODELS.video,
      { image_url: imageUrl, prompt: req.prompt, resolution: "720p", aspect_ratio: "16:9" },
      videoResult,
    );
    return {
      kind: "video",
      data: await download(out.video.url),
      ext: "mp4",
      model: FAL_MODELS.video,
      costUsd: PRICE_USD.clip720p,
    };
  },
};
