import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { catalog } from "@/config/catalog";
import { getAiProvider } from "@/server/ai";
import { buildClipPrompt } from "@/server/ai/prompts";
import { clips, shots } from "@/server/db/schema";
import { readFile, saveFile } from "@/server/storage/local";
import { recordUsage } from "@/server/services/usage";
import { now } from "@/lib/ids";
import type { JobHandler } from "../types";

const schema = z.object({ clipId: z.string() });

/** Turns a finished shot into a 5-second clip. */
export const generateClip: JobHandler<z.infer<typeof schema>> = {
  schema,
  async run({ db, job, payload, progress }) {
    const clip = db.select().from(clips).where(eq(clips.id, payload.clipId)).get();
    if (!clip) return;
    const shot = db.select().from(shots).where(eq(shots.id, clip.shotId)).get();
    if (!shot?.imagePath) throw new Error("The shot for this clip has no picture");

    db.update(clips).set({ status: "running", updatedAt: now() }).where(eq(clips.id, clip.id)).run();
    const move = catalog.move(clip.moveKey);
    const prompt = buildClipPrompt(move, catalog.shot(shot.templateKey));
    progress("Making the clip");
    const ai = await getAiProvider();
    const started = Date.now();
    const result = await ai.generateClip({ prompt, move, still: { label: "the wedding photo", data: await readFile(shot.imagePath), contentType: "image/jpeg" } });

    const videoPath = result.kind === "video" ? await saveFile(`projects/${clip.projectId}/clips`, result.ext, result.data) : null;
    db.update(clips)
      .set({ status: "done", videoPath, previewOnly: result.kind === "preview", prompt, error: null, updatedAt: now() })
      .where(eq(clips.id, clip.id))
      .run();
    recordUsage(db, { projectId: clip.projectId, jobId: job.id, provider: ai.name, model: result.model, kind: "video", costUsd: result.costUsd, durationMs: Date.now() - started });
  },
  onFailure({ db, payload }) {
    db.update(clips).set({ status: "failed", error: "The clip could not be made. Please try again.", updatedAt: now() }).where(eq(clips.id, payload.clipId)).run();
  },
};
