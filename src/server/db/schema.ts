import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

/**
 * Database tables. After changing this file run `npm run db:generate`
 * to create a migration in /drizzle, then commit it.
 *
 * Times are stored as Unix milliseconds. IDs are random UUIDs.
 */

/** One couple's wedding preview. */
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  brideName: text("bride_name").notNull(),
  groomName: text("groom_name").notNull(),
  // Selections: keys from src/config/catalog.ts
  /** Secret for the family share page (/share/<token>). Made the first time the couple shares. */
  shareToken: text("share_token").unique(),
  traditionKey: text("tradition_key").notNull().default("north"),
  timeKey: text("time_key").notNull().default("golden"),
  venueKey: text("venue_key").notNull(),
  themeKey: text("theme_key").notNull(),
  flowerKey: text("flower_key").notNull(),
  mandapKey: text("mandap_key").notNull(),
  lightKey: text("light_key").notNull(),
  brideOutfitKey: text("bride_outfit_key").notNull(),
  groomOutfitKey: text("groom_outfit_key").notNull(),
  // Uploaded venue photo and its depth map (paths inside STORAGE_DIR)
  venuePhotoPath: text("venue_photo_path"),
  venueDepthPath: text("venue_depth_path"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/** Photos of the bride and groom used to keep their faces the same in every shot. */
export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    person: text("person", { enum: ["bride", "groom"] }).notNull(),
    path: text("path").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("photos_project_idx").on(t.projectId)],
);

/** One picture per shot template per project (e.g. "varmala"). */
export const shots = sqliteTable(
  "shots",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    templateKey: text("template_key").notNull(),
    status: text("status", { enum: ["queued", "running", "done", "failed"] }).notNull(),
    imagePath: text("image_path"),
    /** Fingerprint of the selections used, to tell when a shot is out of date. */
    selectionHash: text("selection_hash"),
    prompt: text("prompt"),
    provider: text("provider"),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("shots_project_template_idx").on(t.projectId, t.templateKey)],
);

/** A short video made from one shot. */
export const clips = sqliteTable(
  "clips",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    shotId: text("shot_id").notNull().references(() => shots.id, { onDelete: "cascade" }),
    moveKey: text("move_key").notNull(),
    status: text("status", { enum: ["queued", "running", "done", "failed"] }).notNull(),
    videoPath: text("video_path"),
    /** Demo mode makes no real video; the screen animates the still instead. */
    previewOnly: integer("preview_only", { mode: "boolean" }).notNull().default(false),
    prompt: text("prompt"),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("clips_project_idx").on(t.projectId)],
);

/** Background work: every AI call runs as a job so pages never wait on it. */
export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["analyze_venue", "generate_shot", "generate_clip"] }).notNull(),
    /** JSON input for the job handler. */
    payload: text("payload").notNull(),
    status: text("status", { enum: ["queued", "running", "done", "failed"] }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    /** Short human-readable progress, shown on screen. */
    progress: text("progress"),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    startedAt: integer("started_at"),
    finishedAt: integer("finished_at"),
  },
  (t) => [index("jobs_status_idx").on(t.status), index("jobs_project_idx").on(t.projectId)],
);

/** Every paid (or demo) AI call, for the cost dashboard. */
export const usageEvents = sqliteTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    jobId: text("job_id"),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    kind: text("kind", { enum: ["image", "video", "depth"] }).notNull(),
    costUsd: real("cost_usd").notNull(),
    costInr: real("cost_inr").notNull(),
    durationMs: integer("duration_ms").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("usage_project_idx").on(t.projectId)],
);

/** A family member's "love it" on a shot, from the public share page. One per person per shot. */
export const votes = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    templateKey: text("template_key").notNull(),
    /** Random ID kept in the voter's browser, so one person counts once per shot. */
    voterId: text("voter_id").notNull(),
    voterName: text("voter_name"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("votes_unique_idx").on(t.projectId, t.templateKey, t.voterId)],
);

/** A couple asked vendors to quote on their approved look. */
export const quoteRequests = sqliteTable("quote_requests", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  /** JSON array of { label, detail, low, high }. */
  items: text("items").notNull(),
  totalLow: integer("total_low").notNull(),
  totalHigh: integer("total_high").notNull(),
  vendorCount: integer("vendor_count").notNull(),
  createdAt: integer("created_at").notNull(),
});

export type Project = typeof projects.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type Shot = typeof shots.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type Vote = typeof votes.$inferSelect;
