import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { ANCHOR_SHOT_KEY, shotsFor } from "@/config/catalog";

const NORTH = shotsFor("north");
import { getDb } from "@/server/db/client";
import { jobs, shots, usageEvents } from "@/server/db/schema";
import { drainQueue } from "@/server/jobs/worker";
import { setAiProviderForTests } from "@/server/ai";
import type { AiProvider } from "@/server/ai/types";
import { addPhoto, createProject, getProjectState, setVenuePhoto, updateProject } from "@/server/services/projects";
import { requestShots } from "@/server/services/shots";
import { requestClip } from "@/server/services/clips";
import { createQuoteRequest } from "@/server/services/quoteRequests";
import { UserError } from "@/server/services/errors";
import { fakePhoto } from "./helpers";

/**
 * End-to-end test of the whole pipeline with the demo provider:
 * project → photos → venue → shots (anchor first) → stale detection → clip → quote.
 */
describe("wedding preview pipeline", () => {
  const db = getDb();
  let projectId = "";

  beforeAll(async () => {
    projectId = createProject(db, { brideName: "Priya", groomName: "Arjun" }).id;
    await addPhoto(db, projectId, "bride", await fakePhoto("#e8c7d0"));
    await addPhoto(db, projectId, "groom", await fakePhoto("#c9d8e8"));
  });

  afterEach(() => setAiProviderForTests(null));

  it("analyses an uploaded venue photo", async () => {
    await setVenuePhoto(db, projectId, await fakePhoto("#c9a27a", "venue.jpg"));
    await drainQueue(db);
    const state = getProjectState(db, projectId);
    expect(state.venuePhotoUrl).toMatch(/^\/api\/files\//);
    expect(state.venueDepthUrl).toMatch(/\.png$/);
  });

  it("draws the anchor shot first, then the rest using it as a reference", async () => {
    requestShots(db, projectId, NORTH.map((t) => t.key));
    // Before running, only the anchor job is queued; the others wait for it.
    const queued = db.select().from(jobs).where(eq(jobs.status, "queued")).all();
    expect(queued).toHaveLength(1);

    await drainQueue(db);
    const state = getProjectState(db, projectId);
    expect(state.shots).toHaveLength(NORTH.length);
    expect(state.shots.every((s) => s.status === "done" && s.url && !s.stale)).toBe(true);

    const rows = db.select().from(shots).where(eq(shots.projectId, projectId)).all();
    const anchor = rows.find((r) => r.templateKey === ANCHOR_SHOT_KEY)!;
    const other = rows.find((r) => r.templateKey !== ANCHOR_SHOT_KEY)!;
    expect(anchor.prompt).not.toContain("earlier photo");
    expect(other.prompt).toContain("an earlier photo from this same wedding");
    expect(other.prompt).toContain("the wedding venue");
  });

  it("marks shots out of date when a choice changes", () => {
    updateProject(db, projectId, { themeKey: "pastel" });
    const state = getProjectState(db, projectId);
    expect(state.shots.every((s) => s.stale)).toBe(true);
  });

  it("redraws only the requested shots, reusing the anchor", async () => {
    requestShots(db, projectId, ["varmala"]);
    await drainQueue(db);
    const state = getProjectState(db, projectId);
    expect(state.shots.find((s) => s.templateKey === "varmala")!.stale).toBe(false);
    expect(state.shots.find((s) => s.templateKey === "pheras")!.stale).toBe(true);
  });

  it("makes a clip preview from a finished shot", async () => {
    const shot = getProjectState(db, projectId).shots.find((s) => s.templateKey === "portrait")!;
    requestClip(db, projectId, shot.id, "orbit");
    await drainQueue(db);
    const clip = getProjectState(db, projectId).clips[0]!;
    expect(clip.status).toBe("done");
    expect(clip.previewOnly).toBe(true);
  });

  it("records every AI call for the cost dashboard", () => {
    const events = db.select().from(usageEvents).where(eq(usageEvents.projectId, projectId)).all();
    expect(events.filter((e) => e.kind === "image").length).toBeGreaterThanOrEqual(NORTH.length + 1);
    expect(events.some((e) => e.kind === "video")).toBe(true);
    expect(events.some((e) => e.kind === "depth")).toBe(true);
    expect(getProjectState(db, projectId).spend.images).toBeGreaterThan(0);
  });

  it("saves a vendor quote request", () => {
    const res = createQuoteRequest(db, projectId);
    expect(res.vendorCount).toBe(3);
  });

  it("refuses a clip for a shot that is not drawn", async () => {
    const fresh = createProject(db, { brideName: "A", groomName: "B" }).id;
    requestShots(db, fresh, ["entry"]);
    const shot = getProjectState(db, fresh).shots[0]!;
    expect(() => requestClip(db, fresh, shot.id, "pan")).toThrow(UserError);
    await drainQueue(db); // leave the queue empty for the next test
  });

  it("retries a failing AI call once, then marks the shot and its follow-ups failed", async () => {
    let calls = 0;
    const failing: AiProvider = {
      name: "mock",
      maxReferences: 8,
      referenceIndexBase: 1,
      capabilities: { realPictures: false, realDepth: false, realVideo: false },
      analyzeVenue: async () => {
        throw new Error("boom");
      },
      generateShot: async () => {
        calls++;
        throw new Error("service unavailable");
      },
      generateClip: async () => {
        throw new Error("boom");
      },
    };
    setAiProviderForTests(failing);
    const fresh = createProject(db, { brideName: "C", groomName: "D" }).id;
    requestShots(db, fresh, ["entry", "varmala"]);
    await drainQueue(db);
    expect(calls).toBe(2); // first try + one retry
    const state = getProjectState(db, fresh);
    expect(state.shots.find((s) => s.templateKey === "entry")!.status).toBe("failed");
    expect(state.shots.find((s) => s.templateKey === "varmala")!.status).toBe("failed");
    expect(state.shots[0]!.error).toMatch(/try again/i);
  });
});
