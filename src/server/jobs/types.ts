import type { z } from "zod";
import type { DB } from "@/server/db/client";
import type { Job } from "@/server/db/schema";

export interface JobContext<P> {
  db: DB;
  job: Job;
  payload: P;
  /** Saves a short progress message the screen can show. */
  progress: (message: string) => void;
}

/** One kind of background work. Handlers live in ./handlers. */
export interface JobHandler<P> {
  schema: z.ZodType<P>;
  run(ctx: JobContext<P>): Promise<void>;
  /** Called once a job has failed for the last time, to mark related records as failed. */
  onFailure?(ctx: JobContext<P>, error: Error): Promise<void> | void;
}
