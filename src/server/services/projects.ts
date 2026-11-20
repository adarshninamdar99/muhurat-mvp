import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { catalog, DEFAULT_SELECTIONS } from "@/config/catalog";
import type { DB } from "@/server/db/client";
import { clips, jobs, photos, projects, shots, usageEvents, votes, type Photo, type Project } from "@/server/db/schema";
import { env } from "@/server/env";
import { CLOUDFLARE_FREE, PRICE_USD } from "@/config/pricing";
import { enqueueJob } from "@/server/jobs/queue";
import { deleteFile, fileUrl, saveFile } from "@/server/storage/local";
import { normalizeUpload } from "@/server/storage/images";
import { newId, now } from "@/lib/ids";
import type { ProjectState, Selections } from "@/lib/types";
import { NotFoundError, UserError } from "./errors";
import { projectSpend } from "./usage";

/** Most photos kept per person. More than 5 rarely helps the model. */
export const MAX_PHOTOS_PER_PERSON = 5;

export function createProject(db: DB, input: { brideName: string; groomName: string }): Project {
  const t = now();
  const row: Project = {
    id: newId(),
    brideName: input.brideName.trim(),
    groomName: input.groomName.trim(),
    shareToken: null,
    ...DEFAULT_SELECTIONS,
    venuePhotoPath: null,
    venueDepthPath: null,
    createdAt: t,
    updatedAt: t,
  };
  db.insert(projects).values(row).run();
  return row;
}

export function requireProject(db: DB, id: string): Project {
  const project = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) throw new NotFoundError("Preview");
  return project;
}

export function listProjects(db: DB, limit = 20): Project[] {
  return db.select().from(projects).orderBy(desc(projects.updatedAt)).limit(limit).all();
}

export function selectionsOf(p: Project): Selections {
  return {
    traditionKey: p.traditionKey,
    timeKey: p.timeKey,
    venueKey: p.venueKey,
    themeKey: p.themeKey,
    flowerKey: p.flowerKey,
    mandapKey: p.mandapKey,
    lightKey: p.lightKey,
    brideOutfitKey: p.brideOutfitKey,
    groomOutfitKey: p.groomOutfitKey,
  };
}

export function updateProject(db: DB, id: string, changes: Partial<Selections> & { brideName?: string; groomName?: string }): Project {
  requireProject(db, id);
  const clean = Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined));
  db.update(projects).set({ ...clean, updatedAt: now() }).where(eq(projects.id, id)).run();
  return requireProject(db, id);
}

export function photosOf(db: DB, projectId: string): Photo[] {
  return db.select().from(photos).where(eq(photos.projectId, projectId)).orderBy(asc(photos.createdAt)).all();
}

/**
 * Fingerprint of everything that affects how a picture looks.
 * If it changes after a shot was made, that shot is shown as out of date.
 */
export function selectionHash(project: Project, projectPhotos: Photo[]): string {
  const parts = [
    ...Object.values(selectionsOf(project)),
    project.venuePhotoPath ?? "",
    ...projectPhotos.map((p) => p.id).sort(),
  ];
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
}

export async function addPhoto(db: DB, projectId: string, person: "bride" | "groom", file: File): Promise<void> {
  requireProject(db, projectId);
  const existing = photosOf(db, projectId).filter((p) => p.person === person);
  if (existing.length >= MAX_PHOTOS_PER_PERSON) {
    throw new UserError(`You can add up to ${MAX_PHOTOS_PER_PERSON} photos per person. Remove one first.`);
  }
  const { data, width, height } = await normalizeUpload(file);
  const path = await saveFile(`projects/${projectId}/photos`, "jpg", data);
  db.insert(photos).values({ id: newId(), projectId, person, path, width, height, createdAt: now() }).run();
  db.update(projects).set({ updatedAt: now() }).where(eq(projects.id, projectId)).run();
}

export async function removePhoto(db: DB, projectId: string, photoId: string): Promise<void> {
  const photo = db.select().from(photos).where(and(eq(photos.id, photoId), eq(photos.projectId, projectId))).get();
  if (!photo) throw new NotFoundError("Photo");
  db.delete(photos).where(eq(photos.id, photoId)).run();
  await deleteFile(photo.path);
}

/** Saves the venue photo and starts the depth analysis in the background. */
export async function setVenuePhoto(db: DB, projectId: string, file: File): Promise<void> {
  const project = requireProject(db, projectId);
  const { data } = await normalizeUpload(file);
  const path = await saveFile(`projects/${projectId}/venue`, "jpg", data);
  db.update(projects).set({ venuePhotoPath: path, venueDepthPath: null, updatedAt: now() }).where(eq(projects.id, projectId)).run();
  for (const old of [project.venuePhotoPath, project.venueDepthPath]) if (old) await deleteFile(old);
  enqueueJob(db, { projectId, type: "analyze_venue", payload: { projectId } });
}

export async function clearVenuePhoto(db: DB, projectId: string): Promise<void> {
  const project = requireProject(db, projectId);
  db.update(projects).set({ venuePhotoPath: null, venueDepthPath: null, updatedAt: now() }).where(eq(projects.id, projectId)).run();
  for (const old of [project.venuePhotoPath, project.venueDepthPath]) if (old) await deleteFile(old);
}

/** What each provider really does (mirrors the `capabilities` of each AiProvider). */
const CAPABILITIES = {
  mock: { realPictures: false, realDepth: false, realVideo: false },
  cloudflare: { realPictures: true, realDepth: false, realVideo: false },
  fal: { realPictures: true, realDepth: true, realVideo: true },
} as const;

/** Pictures made today on Cloudflare's free plan, counted from 00:00 UTC (when the allowance resets). */
export function cloudflareAllowance(db: DB): { picturesToday: number; approxDailyLimit: number } {
  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);
  const row = db
    .select({ n: sql<number>`count(*)` })
    .from(usageEvents)
    .where(and(eq(usageEvents.provider, "cloudflare"), eq(usageEvents.kind, "image"), gte(usageEvents.createdAt, startOfUtcDay.getTime())))
    .get();
  return { picturesToday: row?.n ?? 0, approxDailyLimit: CLOUDFLARE_FREE.picturesPerDay };
}

export function voteCounts(db: DB, projectId: string): Record<string, number> {
  const rows = db
    .select({ key: votes.templateKey, n: sql<number>`count(*)` })
    .from(votes)
    .where(eq(votes.projectId, projectId))
    .groupBy(votes.templateKey)
    .all();
  return Object.fromEntries(rows.map((r) => [r.key, r.n]));
}

/** Everything the studio screens need, in one object. */
export function getProjectState(db: DB, id: string): ProjectState {
  const project = requireProject(db, id);
  const projectPhotos = photosOf(db, id);
  const hash = selectionHash(project, projectPhotos);
  // Only the shots of the couple's tradition are shown. Shots from another
  // tradition stay saved and come back if the couple switches back.
  const order = catalog.tradition(project.traditionKey).shots;
  const shotRows = db
    .select()
    .from(shots)
    .where(and(eq(shots.projectId, id), inArray(shots.templateKey, order)))
    .all()
    .sort((a, b) => order.indexOf(a.templateKey) - order.indexOf(b.templateKey));
  const clipRows = db.select().from(clips).where(eq(clips.projectId, id)).orderBy(desc(clips.createdAt)).all();
  const jobRows = db
    .select()
    .from(jobs)
    .where(and(eq(jobs.projectId, id), inArray(jobs.status, ["queued", "running"])))
    .orderBy(asc(jobs.createdAt))
    .all();

  return {
    id: project.id,
    brideName: project.brideName,
    groomName: project.groomName,
    selections: selectionsOf(project),
    venuePhotoUrl: fileUrl(project.venuePhotoPath),
    venueDepthUrl: fileUrl(project.venueDepthPath),
    photos: projectPhotos.map((p) => ({ id: p.id, person: p.person, url: fileUrl(p.path)! })),
    shots: shotRows.map((s) => ({
      id: s.id,
      templateKey: s.templateKey,
      status: s.status,
      url: fileUrl(s.imagePath),
      stale: s.status === "done" && s.selectionHash !== hash,
      error: s.error,
      updatedAt: s.updatedAt,
    })),
    clips: clipRows.map((c) => ({
      id: c.id,
      shotId: c.shotId,
      moveKey: c.moveKey,
      status: c.status,
      url: fileUrl(c.videoPath),
      previewOnly: c.previewOnly,
      error: c.error,
      updatedAt: c.updatedAt,
    })),
    activeJobs: jobRows.map((j) => ({ id: j.id, type: j.type, status: j.status, progress: j.progress, error: j.error })),
    spend: projectSpend(db, id),
    prices:
      env.AI_PROVIDER === "fal"
        ? { imageInr: PRICE_USD.image * env.USD_TO_INR, clipInr: PRICE_USD.clip720p * env.USD_TO_INR }
        : { imageInr: 0, clipInr: 0 },
    provider: env.AI_PROVIDER,
    capabilities: CAPABILITIES[env.AI_PROVIDER],
    allowance: env.AI_PROVIDER === "cloudflare" ? cloudflareAllowance(db) : null,
    votes: voteCounts(db, id),
    recentVotes: db
      .select({ id: votes.id, templateKey: votes.templateKey, voterName: votes.voterName, createdAt: votes.createdAt })
      .from(votes)
      .where(and(eq(votes.projectId, id), inArray(votes.templateKey, order)))
      .orderBy(desc(votes.createdAt))
      .limit(6)
      .all(),
  };
}
