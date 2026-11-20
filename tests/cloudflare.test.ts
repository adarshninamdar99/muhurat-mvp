import { afterEach, describe, expect, it, vi } from "vitest";

// This file runs the app on the free Cloudflare setting. The settings must be in
// place before the app's modules load, so they are set in vi.hoisted.
vi.hoisted(() => {
  process.env.AI_PROVIDER = "cloudflare";
  process.env.CLOUDFLARE_ACCOUNT_ID = "acc123";
  process.env.CLOUDFLARE_API_TOKEN = "test-token";
});

import sharp from "sharp";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { shots } from "@/server/db/schema";
import { AllowanceUsedUpError, CLOUDFLARE_IMAGE_MODEL, cloudflareProvider } from "@/server/ai/providers/cloudflare";
import { drainQueue } from "@/server/jobs/worker";
import { addPhoto, createProject, getProjectState } from "@/server/services/projects";
import { requestShots } from "@/server/services/shots";
import type { ShotRequest } from "@/server/ai/types";
import { fakePhoto } from "./helpers";

const png = () => sharp({ create: { width: 64, height: 36, channels: 3, background: "#d9a" } }).png().toBuffer();
const imageResponse = async () => new Response(new Uint8Array(await png()), { status: 200, headers: { "content-type": "image/png" } });

function stubFetch(handler: (url: string, init: RequestInit) => Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return handler(url, init);
    }),
  );
  return calls;
}

/** The Cloudflare provider only reads the prompt and references; the scene is not used. */
const noScene = {} as ShotRequest["scene"];

const request = async (refCount: number): Promise<ShotRequest> => ({
  scene: noScene,
  prompt: "a test prompt",
  references: await Promise.all(
    Array.from({ length: refCount }, async (_, i) => ({ label: `ref ${i}`, data: await png(), contentType: "image/png" })),
  ),
});

afterEach(() => vi.unstubAllGlobals());

describe("Cloudflare Workers AI provider (free)", () => {
  it("sends the prompt and up to 4 reference pictures as a multipart form", async () => {
    const calls = stubFetch(imageResponse);
    const result = await cloudflareProvider.generateShot(await request(6));

    expect(calls).toHaveLength(1);
    const { url, init } = calls[0]!;
    expect(url).toBe(`https://api.cloudflare.com/client/v4/accounts/acc123/ai/run/${CLOUDFLARE_IMAGE_MODEL}`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    const form = init.body as FormData;
    expect(form.get("prompt")).toBe("a test prompt");
    expect(form.get("width")).toBe("1024");
    expect(form.get("height")).toBe("576");
    expect(form.has("input_image_3")).toBe(true);
    expect(form.has("input_image_4")).toBe(false);
    expect(result.ext).toBe("jpg");
    expect(result.costUsd).toBe(0);
    expect((await sharp(result.data).metadata()).format).toBe("jpeg");
  });

  it("shrinks references to fit inside 512 × 512", async () => {
    const calls = stubFetch(imageResponse);
    const big = await sharp({ create: { width: 2000, height: 1200, channels: 3, background: "#888" } }).jpeg().toBuffer();
    await cloudflareProvider.generateShot({ scene: noScene, prompt: "p", references: [{ label: "big", data: big, contentType: "image/jpeg" }] });
    const sent = (calls[0]!.init.body as FormData).get("input_image_0") as Blob;
    const meta = await sharp(Buffer.from(await sent.arrayBuffer())).metadata();
    expect(Math.max(meta.width!, meta.height!)).toBeLessThan(512);
  });

  it("reads Cloudflare's JSON reply with a base64 image", async () => {
    stubFetch(async () => Response.json({ result: { image: (await png()).toString("base64") }, success: true }));
    const result = await cloudflareProvider.generateShot(await request(0));
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("explains a used-up daily allowance, and marks it as not worth retrying", async () => {
    stubFetch(async () => new Response(JSON.stringify({ errors: [{ code: 4006, message: "daily free allocation of 10,000 neurons used" }] }), { status: 429 }));
    const err = await cloudflareProvider.generateShot(await request(0)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AllowanceUsedUpError);
    expect((err as AllowanceUsedUpError).retryable).toBe(false);
    expect((err as Error).message).toMatch(/resets at 5:30 am IST/);
  });

  it("explains a wrong API token", async () => {
    stubFetch(async () => new Response("Authentication error", { status: 401 }));
    await expect(cloudflareProvider.generateShot(await request(0))).rejects.toThrow(/CLOUDFLARE_API_TOKEN/);
  });
});

describe("the app on the free setting", () => {
  const db = getDb();

  it("numbers references from image 0 and counts today's free pictures", async () => {
    const calls = stubFetch(imageResponse);
    const id = createProject(db, { brideName: "Meera", groomName: "Karthik" }).id;
    await addPhoto(db, id, "bride", await fakePhoto("#e8c7d0"));
    await addPhoto(db, id, "groom", await fakePhoto("#c9d8e8"));

    requestShots(db, id, ["entry", "varmala"]);
    await drainQueue(db);

    expect(calls).toHaveLength(2);
    const second = (calls[1]!.init.body as FormData).get("prompt") as string;
    expect(second).toContain("image 0 is the bride");
    expect(second).toContain("an earlier photo from this same wedding");

    const state = getProjectState(db, id);
    expect(state.provider).toBe("cloudflare");
    expect(state.capabilities).toEqual({ realPictures: true, realDepth: false, realVideo: false });
    expect(state.prices.imageInr).toBe(0);
    expect(state.allowance?.picturesToday).toBe(2);
    expect(state.allowance?.approxDailyLimit).toBeGreaterThan(50);
  });

  it("does not retry when the allowance is used up, and tells the couple when it resets", async () => {
    const calls = stubFetch(async () => new Response("4006: neurons exhausted", { status: 429 }));
    const id = createProject(db, { brideName: "Isha", groomName: "Rohan" }).id;
    requestShots(db, id, ["entry"]);
    await drainQueue(db);
    expect(calls).toHaveLength(1);
    const shot = db.select().from(shots).where(eq(shots.projectId, id)).get()!;
    expect(shot.status).toBe("failed");
    expect(shot.error).toMatch(/free AI allowance is used up/);
  });
});
