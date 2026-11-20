import "server-only";
import { jobs, type Job } from "@/server/db/schema";
import type { DB } from "@/server/db/client";
import { newId, now } from "@/lib/ids";
import { jobEvents, JOB_ADDED } from "./events";

export type JobType = Job["type"];

/** Adds a job to the queue and wakes the worker. Returns the job id. */
export function enqueueJob(db: DB, input: { projectId: string; type: JobType; payload: unknown }): string {
  const id = newId();
  db.insert(jobs)
    .values({
      id,
      projectId: input.projectId,
      type: input.type,
      payload: JSON.stringify(input.payload),
      status: "queued",
      createdAt: now(),
    })
    .run();
  jobEvents.emit(JOB_ADDED);
  return id;
}
