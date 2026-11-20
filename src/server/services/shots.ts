import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { ANCHOR_SHOT_KEY, catalog } from "@/config/catalog";
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
  const project = requireProject(db, projectId);
  // Only shots that belong to the couple's tradition can be drawn.
  const valid = new Set(catalog.tradition(project.traditionKey).shots);
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
    tradition: catalog.tradition(project.traditionKey),
    time: catalog.time(project.timeKey),
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

/**
 * Collects reference images and writes the prompt for one shot.
 *
 * Images are gathered in priority order, then cut to what the AI provider
 * accepts (4 on the free Cloudflare model, 8 on fal.ai). Priority:
 *   1. one photo of the bride      2. one photo of the groom
 *   3. the anchor shot (keeps décor and outfits consistent)
 *   4. the venue photo             5–6. outfit catalogue photos
 *   7–8. second photos of the bride and groom
 */
export async function buildShotRequest(db: DB, project: Project, shot: Shot, limits?: { maxReferences: number; indexBase: 0 | 1 }): Promise<ShotRequest> {
  const maxReferences = limits?.maxReferences ?? 8;
  const indexBase = limits?.indexBase ?? 1;
  const scene = sceneFor(project, shot.templateKey);
  const jpeg = (label: string, data: Buffer): ReferenceImage => ({ label, data, contentType: "image/jpeg" });
  type Candidate = () => Promise<ReferenceImage | null>;
  const candidates: Candidate[] = [];

  const projectPhotos = photosOf(db, project.id);
  const photoOf = (person: "bride" | "groom", n: number): Candidate => async () => {
    const photo = projectPhotos.filter((p) => p.person === person)[n];
    return photo ? jpeg(`the ${person}, photo ${n + 1} (face reference)`, await readFile(photo.path)) : null;
  };

  candidates.push(photoOf("bride", 0), photoOf("groom", 0));
  if (shot.templateKey !== ANCHOR_SHOT_KEY) {
    candidates.push(async () => {
      const anchor = db.select().from(shots).where(and(eq(shots.projectId, project.id), eq(shots.templateKey, ANCHOR_SHOT_KEY))).get();
      return anchor?.status === "done" && anchor.imagePath ? jpeg("an earlier photo from this same wedding", await readFile(anchor.imagePath)) : null;
    });
  }
  candidates.push(async () => (project.venuePhotoPath ? jpeg("the wedding venue", await readFile(project.venuePhotoPath)) : null));
  candidates.push(async () => {
    const data = await publicImage(scene.brideOutfit.referenceImage);
    return data ? jpeg("the bride's outfit (catalogue photo)", data) : null;
  });
  candidates.push(async () => {
    const data = await publicImage(scene.groomOutfit.referenceImage);
    return data ? jpeg("the groom's outfit (catalogue photo)", data) : null;
  });
  for (let n = 1; n < PHOTOS_PER_PERSON_IN_PROMPT; n++) candidates.push(photoOf("bride", n), photoOf("groom", n));

  const references: ReferenceImage[] = [];
  for (const next of candidates) {
    if (references.length >= maxReferences) break;
    const ref = await next();
    if (ref) references.push(ref);
  }

  const prompt = buildShotPrompt(scene, references.map((r) => r.label), indexBase);
  return { prompt, references, scene };
}
