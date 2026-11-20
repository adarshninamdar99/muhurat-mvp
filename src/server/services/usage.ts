import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import { jobs, projects, usageEvents } from "@/server/db/schema";
import { env } from "@/server/env";
import { newId, now } from "@/lib/ids";

/** Records one AI call and what it cost. */
export function recordUsage(
  db: DB,
  input: { projectId: string; jobId: string; provider: string; model: string; kind: "image" | "video" | "depth"; costUsd: number; durationMs: number },
): void {
  db.insert(usageEvents)
    .values({
      id: newId(),
      ...input,
      costInr: Math.round(input.costUsd * env.USD_TO_INR * 100) / 100,
      createdAt: now(),
    })
    .run();
}

export function projectSpend(db: DB, projectId: string): { images: number; clips: number; inr: number } {
  const row = db
    .select({
      images: sql<number>`coalesce(sum(case when ${usageEvents.kind} = 'image' then 1 else 0 end), 0)`,
      clips: sql<number>`coalesce(sum(case when ${usageEvents.kind} = 'video' then 1 else 0 end), 0)`,
      inr: sql<number>`coalesce(sum(${usageEvents.costInr}), 0)`,
    })
    .from(usageEvents)
    .where(eq(usageEvents.projectId, projectId))
    .get();
  return { images: row?.images ?? 0, clips: row?.clips ?? 0, inr: row?.inr ?? 0 };
}

/** Numbers for the admin page. */
export function adminOverview(db: DB) {
  const totals = db
    .select({
      calls: sql<number>`count(*)`,
      images: sql<number>`coalesce(sum(case when ${usageEvents.kind} = 'image' then 1 else 0 end), 0)`,
      clips: sql<number>`coalesce(sum(case when ${usageEvents.kind} = 'video' then 1 else 0 end), 0)`,
      inr: sql<number>`coalesce(sum(${usageEvents.costInr}), 0)`,
      avgMs: sql<number>`coalesce(avg(case when ${usageEvents.kind} = 'image' then ${usageEvents.durationMs} end), 0)`,
    })
    .from(usageEvents)
    .get();
  const projectCount = db.select({ n: sql<number>`count(*)` }).from(projects).get()?.n ?? 0;
  const perProject = db
    .select({
      id: projects.id,
      brideName: projects.brideName,
      groomName: projects.groomName,
      createdAt: projects.createdAt,
      inr: sql<number>`coalesce(sum(${usageEvents.costInr}), 0)`,
      calls: sql<number>`count(${usageEvents.id})`,
    })
    .from(projects)
    .leftJoin(usageEvents, eq(usageEvents.projectId, projects.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.createdAt))
    .limit(50)
    .all();
  const failedJobs = db.select().from(jobs).where(eq(jobs.status, "failed")).orderBy(desc(jobs.createdAt)).limit(25).all();
  return { totals, projectCount, perProject, failedJobs };
}
