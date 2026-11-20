import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getAiProvider } from "@/server/ai";
import { projects, shots } from "@/server/db/schema";
import { deleteFile, saveFile } from "@/server/storage/local";
import { buildShotRequest } from "@/server/services/shots";
import { photosOf, selectionHash } from "@/server/services/projects";
import { recordUsage } from "@/server/services/usage";
import { enqueueJob } from "../queue";
import { now } from "@/lib/ids";
import type { JobHandler } from "../types";

const schema = z.object({
  shotId: z.string(),
  /** Shot ids to queue once this (anchor) shot is done. */
  followUps: z.array(z.string()).optional(),
});

/** Makes one wedding picture and saves it. */
export const generateShot: JobHandler<z.infer<typeof schema>> = {
  schema,
  async run({ db, job, payload, progress }) {
    const shot = db.select().from(shots).where(eq(shots.id, payload.shotId)).get();
    if (!shot) return;
    const project = db.select().from(projects).where(eq(projects.id, shot.projectId)).get();
    if (!project) return;

    db.update(shots).set({ status: "running", error: null, updatedAt: now() }).where(eq(shots.id, shot.id)).run();
    progress("Collecting photos and choices");
    // Fingerprint taken before generating, so later changes still show as out of date.
    const hash = selectionHash(project, photosOf(db, project.id));
    const ai = await getAiProvider();
    const request = await buildShotRequest(db, project, shot, { maxReferences: ai.maxReferences, indexBase: ai.referenceIndexBase });

    progress("Drawing the picture");
    const started = Date.now();
    const result = await ai.generateShot(request);
    const imagePath = await saveFile(`projects/${project.id}/shots`, result.ext, result.data);

    db.update(shots)
      .set({ status: "done", imagePath, selectionHash: hash, prompt: request.prompt, provider: ai.name, error: null, updatedAt: now() })
      .where(eq(shots.id, shot.id))
      .run();
    if (shot.imagePath) await deleteFile(shot.imagePath);
    recordUsage(db, { projectId: project.id, jobId: job.id, provider: ai.name, model: result.model, kind: "image", costUsd: result.costUsd, durationMs: Date.now() - started });

    for (const id of payload.followUps ?? []) {
      enqueueJob(db, { projectId: project.id, type: "generate_shot", payload: { shotId: id } });
    }
  },
  onFailure({ db, payload }, error) {
    db.update(shots).set({ status: "failed", error: friendly(error), updatedAt: now() }).where(eq(shots.id, payload.shotId)).run();
    // Shots waiting on a failed anchor are marked failed too, so the screen does not wait forever.
    for (const id of payload.followUps ?? []) {
      db.update(shots).set({ status: "failed", error: "The first shot failed, so this one was not drawn. Try again.", updatedAt: now() }).where(eq(shots.id, id)).run();
    }
  },
};

function friendly(error: Error): string {
  if (/free AI allowance/i.test(error.message)) return error.message;
  if (/safety|nsfw|content/i.test(error.message)) return "The AI service declined this picture. Try different photos or choices.";
  return "The picture could not be made. Please try again.";
}
