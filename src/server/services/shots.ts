import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { ANCHOR_SHOT_KEY, catalog, SHOT_TEMPLATES } from "@/config/catalog";
import type { DB } from "@/server/db/client";
import { shots, type Project, type Shot } from "@/server/db/schema";
import { enqueueJob } from "@/server/jobs/queue";
import { readFile } from "@/server/storage/local";
import { buildShotPrompt } from "@/server/ai/prompts";
import type { ReferenceImage, SceneContext, ShotRequest } from "@/server/ai/types";
import { newId, now } from "@/lib/ids";
import { photosOf, requireProject } from "./projects";
import { UserError } from "./errors";

/** At most this many photos per person are sent to the model with each shot. */
const PHOTOS_PER_PERSON_IN_PROMPT = 2;

/** Finds or creates the shot row for a template and marks it queued. */
function queueShotRow(db: DB, projectId: string, templateKey: string): Shot {
  const existing = db.select().from(shots).where(and(eq(shots.projectId, projectId), eq(shots.templateKey, templateKey))).get();
  const t = now();
  if (existing) {
    return db.update(shots).set({ status: "queued", error: null, updatedAt: t }).where(eq(shots.id, existing.id)).returning().get()!;
  }
  return db
    .insert(shots)
    .values({ id: newId(), projectId, templateKey, status: "queued", createdAt: t, updatedAt: t })
    .returning()
    .get();
}

/**
 * Starts making the requested shots.
 *
 * Consistency rule: the anchor shot (first in SHOT_TEMPLATES) is made first.
 * Every other shot is sent the anchor picture as a reference so décor,
 * colours and outfits match. If the anchor needs (re)making, the other shots
 * wait and are queued by the anchor job when it finishes.
 */
export function requestShots(db: DB, projectId: string, templateKeys: string[]): { queued: string[] } {
  requireProject(db, projectId);
  const valid = new Set(SHOT_TEMPLATES.map((t) => t.key));
  const keys = [...new Set(templateKeys)].filter((k) => valid.has(k));
  if (keys.length === 0) throw new UserError("Choose at least one shot to draw.");

  const anchor = db.select().from(shots).where(and(eq(shots.projectId, projectId), eq(shots.templateKey, ANCHOR_SHOT_KEY))).get();
  const anchorReady = anchor?.status === "done" && !keys.includes(ANCHOR_SHOT_KEY);
  const busy = (s: Shot | undefined) => s?.status === "queued" || s?.status === "running";

  if (anchorReady) {
    for (const key of keys) {
      const row = queueShotRow(db, projectId, key);
      enqueueJob(db, { projectId, type: "generate_shot", payload: { shotId: row.id } });
    }
    return { queued: keys };
  }

  // Anchor first, then the rest.
  const anchorRow = busy(anchor) ? anchor! : queueShotRow(db, projectId, ANCHOR_SHOT_KEY);
  const followUps = keys.filter((k) => k !== ANCHOR_SHOT_KEY).map((k) => queueShotRow(db, projectId, k).id);
  if (!busy(anchor)) {
    enqueueJob(db, { projectId, type: "generate_shot", payload: { shotId: anchorRow.id, followUps } });
  } else {
    // Anchor already running: queue the rest now; they will use the anchor if it is ready by then.
    for (const id of followUps) enqueueJob(db, { projectId, type: "generate_shot", payload: { shotId: id } });
  }
  return { queued: [ANCHOR_SHOT_KEY, ...keys.filter((k) => k !== ANCHOR_SHOT_KEY)] };
}

export function sceneFor(project: Project, templateKey: string): SceneContext {
  return {
    brideName: project.brideName,
    groomName: project.groomName,
    venue: catalog.venue(project.venueKey),
    venueFromPhoto: Boolean(project.venuePhotoPath),
    theme: catalog.theme(project.themeKey),
    flower: catalog.flower(project.flowerKey),
    mandap: catalog.mandap(project.mandapKey),
    light: catalog.light(project.lightKey),
    brideOutfit: catalog.brideOutfit(project.brideOutfitKey),
    groomOutfit: catalog.groomOutfit(project.groomOutfitKey),
    template: catalog.shot(templateKey),
  };
}

async function publicImage(relative: string | undefined): Promise<Buffer | null> {
  if (!relative) return null;
  try {
    return await fs.readFile(path.join(process.cwd(), "public", relative));
  } catch {
    return null; // A missing catalogue photo should not stop the shot.
  }
}

/** Collects reference images, in a fixed order, and writes the prompt for one shot. */
export async function buildShotRequest(db: DB, project: Project, shot: Shot): Promise<ShotRequest> {
  const scene = sceneFor(project, shot.templateKey);
  const references: ReferenceImage[] = [];
  const jpeg = (label: string, data: Buffer): ReferenceImage => ({ label, data, contentType: "image/jpeg" });

  const projectPhotos = photosOf(db, project.id);
  for (const person of ["bride", "groom"] as const) {
    const mine = projectPhotos.filter((p) => p.person === person).slice(0, PHOTOS_PER_PERSON_IN_PROMPT);
    for (const [i, photo] of mine.entries()) {
      references.push(jpeg(`the ${person}, photo ${i + 1} (face reference)`, await readFile(photo.path)));
    }
  }

  if (project.venuePhotoPath) references.push(jpeg("the wedding venue", await readFile(project.venuePhotoPath)));

  const brideRef = await publicImage(scene.brideOutfit.referenceImage);
  if (brideRef) references.push(jpeg("the bride's outfit (catalogue photo)", brideRef));
  const groomRef = await publicImage(scene.groomOutfit.referenceImage);
  if (groomRef) references.push(jpeg("the groom's outfit (catalogue photo)", groomRef));

  if (shot.templateKey !== ANCHOR_SHOT_KEY) {
    const anchor = db.select().from(shots).where(and(eq(shots.projectId, project.id), eq(shots.templateKey, ANCHOR_SHOT_KEY))).get();
    if (anchor?.status === "done" && anchor.imagePath) {
      references.push(jpeg("an earlier photo from this same wedding", await readFile(anchor.imagePath)));
    }
  }

  const prompt = buildShotPrompt(scene, references.map((r) => r.label));
  return { prompt, references, scene };
}
