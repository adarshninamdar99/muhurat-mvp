import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDb, type DB } from "@/server/db/client";
import { jobs, type Job } from "@/server/db/schema";
import { env } from "@/server/env";
import { now } from "@/lib/ids";
import { jobEvents, JOB_ADDED } from "./events";
import { handlers } from "./handlers";

/**
 * The background worker. Runs inside the Next.js server process
 * (started from src/instrumentation.ts) and processes queued jobs,
 * JOB_CONCURRENCY at a time.
 *
 * Retries: a job that throws is tried again once (MAX_ATTEMPTS = 2).
 * Restarts: jobs left "running" by a crash are put back in the queue at start-up.
 *
 * For larger scale, replace this file with a real queue (BullMQ + Redis,
 * or a hosted queue); the handlers in ./handlers can stay as they are.
 */

const MAX_ATTEMPTS = 2;

interface WorkerState {
  started: boolean;
  running: number;
}

const globalForWorker = globalThis as unknown as { __muhuratWorker?: WorkerState };
const state: WorkerState = globalForWorker.__muhuratWorker ?? { started: false, running: 0 };
globalForWorker.__muhuratWorker = state;

/** Atomically takes the oldest queued job and marks it running. */
function claimNext(db: DB): Job | null {
  return db.transaction((tx) => {
    const next = tx.select().from(jobs).where(eq(jobs.status, "queued")).orderBy(asc(jobs.createdAt)).limit(1).get();
    if (!next) return null;
    const updated = tx
      .update(jobs)
      .set({ status: "running", startedAt: now(), attempts: next.attempts + 1, error: null })
      .where(and(eq(jobs.id, next.id), eq(jobs.status, "queued")))
      .returning()
      .get();
    return updated ?? null;
  });
}

export async function processJob(db: DB, job: Job): Promise<void> {
  const handler = handlers[job.type];
  const progress = (message: string) => {
    db.update(jobs).set({ progress: message }).where(eq(jobs.id, job.id)).run();
  };
  let payload: unknown;
  try {
    payload = handler.schema.parse(JSON.parse(job.payload));
  } catch (err) {
    db.update(jobs)
      .set({ status: "failed", error: `Bad job input: ${(err as Error).message}`, finishedAt: now() })
      .where(eq(jobs.id, job.id))
      .run();
    return;
  }
  const ctx = { db, job, payload, progress };
  try {
    // The handler type is erased here; each handler validated its own payload above.
    await (handler.run as (c: typeof ctx) => Promise<void>)(ctx);
    db.update(jobs).set({ status: "done", progress: null, finishedAt: now() }).where(eq(jobs.id, job.id)).run();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const finalAttempt = job.attempts >= MAX_ATTEMPTS;
    console.error(`[jobs] ${job.type} ${job.id} failed (attempt ${job.attempts}):`, error.message);
    db.update(jobs)
      .set({ status: finalAttempt ? "failed" : "queued", error: error.message, progress: null, finishedAt: finalAttempt ? now() : null })
      .where(eq(jobs.id, job.id))
      .run();
    if (finalAttempt && handler.onFailure) {
      await (handler.onFailure as (c: typeof ctx, e: Error) => Promise<void> | void)(ctx, error);
    }
  }
}

function pump(): void {
  const db = getDb();
  while (state.running < env.JOB_CONCURRENCY) {
    const job = claimNext(db);
    if (!job) return;
    state.running++;
    processJob(db, job)
      .catch((err) => console.error("[jobs] unexpected worker error", err))
      .finally(() => {
        state.running--;
        setImmediate(pump);
      });
  }
}

/** Starts the worker once per server process. Safe to call more than once. */
export function startWorker(): void {
  if (state.started) return;
  state.started = true;
  const db = getDb();
  // Recover jobs interrupted by a restart.
  db.update(jobs).set({ status: "queued", progress: null }).where(eq(jobs.status, "running")).run();
  jobEvents.on(JOB_ADDED, () => setImmediate(pump));
  // Safety net in case a wake-up signal is missed.
  setInterval(pump, 3000).unref();
  pump();
  console.log(`[jobs] worker started (concurrency ${env.JOB_CONCURRENCY})`);
}

/** For tests: run every queued job to completion, one at a time. */
export async function drainQueue(db: DB): Promise<void> {
  for (let job = claimNext(db); job; job = claimNext(db)) {
    await processJob(db, job);
  }
}
