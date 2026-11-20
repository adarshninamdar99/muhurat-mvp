import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getAiProvider } from "@/server/ai";
import { projects } from "@/server/db/schema";
import { readFile, saveFile } from "@/server/storage/local";
import { recordUsage } from "@/server/services/usage";
import { now } from "@/lib/ids";
import type { JobHandler } from "../types";

const schema = z.object({ projectId: z.string() });

/** Makes a depth map of the uploaded venue photo. */
export const analyzeVenue: JobHandler<z.infer<typeof schema>> = {
  schema,
  async run({ db, job, payload, progress }) {
    const project = db.select().from(projects).where(eq(projects.id, payload.projectId)).get();
    if (!project?.venuePhotoPath) return; // photo was removed meanwhile; nothing to do
    const photoPath = project.venuePhotoPath;
    progress("Studying the venue");
    const ai = await getAiProvider();
    const started = Date.now();
    const result = await ai.analyzeVenue({ photo: { label: "the wedding venue", data: await readFile(photoPath), contentType: "image/jpeg" } });
    const depthPath = await saveFile(`projects/${project.id}/venue`, result.ext, result.data);
    // Only attach if the venue photo is still the same one.
    db.update(projects).set({ venueDepthPath: depthPath, updatedAt: now() }).where(eq(projects.id, project.id)).run();
    recordUsage(db, { projectId: project.id, jobId: job.id, provider: ai.name, model: result.model, kind: "depth", costUsd: result.costUsd, durationMs: Date.now() - started });
  },
};
