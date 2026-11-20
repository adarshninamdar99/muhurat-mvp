import { describe, expect, it } from "vitest";
import { ANCHOR_SHOT_KEY, catalog, CEREMONY_TIMES, shotsFor, TRADITIONS } from "@/config/catalog";
import { getDb } from "@/server/db/client";
import { drainQueue } from "@/server/jobs/worker";
import { createProject, getProjectState, updateProject } from "@/server/services/projects";
import { requestShots } from "@/server/services/shots";
import { UserError } from "@/server/services/errors";
import { shots } from "@/server/db/schema";
import { eq } from "drizzle-orm";

describe("traditions and muhurat time", () => {
  it("gives every tradition six shots that exist, starting with the anchor", () => {
    for (const t of TRADITIONS) {
      expect(t.shots).toHaveLength(6);
      expect(t.shots[0]).toBe(ANCHOR_SHOT_KEY);
      expect(new Set(t.shots).size).toBe(6);
      expect(() => shotsFor(t.key)).not.toThrow();
    }
    expect(CEREMONY_TIMES.map((c) => c.key)).toContain("golden");
  });

  it("shows only the chosen tradition's shots and refuses the others", async () => {
    const db = getDb();
    const id = createProject(db, { brideName: "Ananya", groomName: "Vikram" }).id;
    requestShots(db, id, ["entry", "varmala"]);
    await drainQueue(db);
    expect(getProjectState(db, id).shots.map((s) => s.templateKey)).toEqual(["entry", "varmala"]);

    updateProject(db, id, { traditionKey: "south" });
    const south = getProjectState(db, id);
    expect(south.shots.map((s) => s.templateKey)).toEqual(["entry"]); // varmala is kept but hidden
    expect(south.shots[0]!.stale).toBe(true); // the tradition is part of every picture
    expect(() => requestShots(db, id, ["varmala"])).toThrow(UserError);

    requestShots(db, id, ["malai-maatral"]);
    await drainQueue(db);
    const row = db
      .select()
      .from(shots)
      .where(eq(shots.projectId, id))
      .all()
      .find((s) => s.templateKey === "malai-maatral")!;
    expect(row.prompt).toContain(catalog.tradition("south").prompt);
    expect(row.prompt).toContain(catalog.time("golden").prompt);

    updateProject(db, id, { traditionKey: "north" });
    expect(getProjectState(db, id).shots.map((s) => s.templateKey)).toEqual(["entry", "varmala"]);
  });

  it("puts the chosen time of day into the prompt", async () => {
    const db = getDb();
    const id = createProject(db, { brideName: "Sara", groomName: "Dev" }).id;
    updateProject(db, id, { timeKey: "night" });
    requestShots(db, id, ["entry"]);
    await drainQueue(db);
    const row = db.select().from(shots).where(eq(shots.projectId, id)).get()!;
    expect(row.prompt).toContain(catalog.time("night").prompt);
  });
});
