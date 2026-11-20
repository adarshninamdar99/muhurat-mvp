import "server-only";
import { and, eq } from "drizzle-orm";
import { catalog } from "@/config/catalog";
import type { DB } from "@/server/db/client";
import { clips, shots } from "@/server/db/schema";
import { enqueueJob } from "@/server/jobs/queue";
import { newId, now } from "@/lib/ids";
import { NotFoundError, UserError } from "./errors";

/** Starts making a 5-second clip from a finished shot. */
export function requestClip(db: DB, projectId: string, shotId: string, moveKey: string): { clipId: string } {
  catalog.move(moveKey); // throws if the camera move does not exist
  const shot = db.select().from(shots).where(and(eq(shots.id, shotId), eq(shots.projectId, projectId))).get();
  if (!shot) throw new NotFoundError("Shot");
  if (shot.status !== "done" || !shot.imagePath) throw new UserError("Draw this shot first, then make a clip from it.");
  const t = now();
  const clipId = newId();
  db.insert(clips).values({ id: clipId, projectId, shotId, moveKey, status: "queued", createdAt: t, updatedAt: t }).run();
  enqueueJob(db, { projectId, type: "generate_clip", payload: { clipId } });
  return { clipId };
}
