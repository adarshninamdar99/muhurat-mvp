import { describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { drainQueue } from "@/server/jobs/worker";
import { createProject, getProjectState } from "@/server/services/projects";
import { requestShots } from "@/server/services/shots";
import { castVote, getOrCreateShareToken, getSharedView } from "@/server/services/share";
import { NotFoundError, UserError } from "@/server/services/errors";
import { lanAddress, publicBaseUrl } from "@/server/publicUrl";

describe("family share page", () => {
  const db = getDb();

  it("keeps one secret link per project", () => {
    const id = createProject(db, { brideName: "Nisha", groomName: "Aman" }).id;
    const token = getOrCreateShareToken(db, id);
    expect(token).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(getOrCreateShareToken(db, id)).toBe(token);
    expect(() => getSharedView(db, "not-a-real-token")).toThrow(NotFoundError);
  });

  it("shows only finished shots and counts each person once per shot", async () => {
    const id = createProject(db, { brideName: "Riya", groomName: "Kabir" }).id;
    requestShots(db, id, ["entry", "varmala"]);
    await drainQueue(db);
    const token = getOrCreateShareToken(db, id);

    const view = getSharedView(db, token);
    expect(view.shots.map((s) => s.templateKey)).toEqual(["entry", "varmala"]);
    expect(view.traditionName).toBe("North Indian");

    castVote(db, token, { templateKey: "varmala", voterId: "voter-aaaa-1", voterName: "Asha aunty", love: true });
    castVote(db, token, { templateKey: "varmala", voterId: "voter-aaaa-1", love: true }); // repeat tap
    castVote(db, token, { templateKey: "varmala", voterId: "voter-bbbb-2", love: true });
    castVote(db, token, { templateKey: "entry", voterId: "voter-bbbb-2", love: true });

    const mine = getSharedView(db, token, "voter-aaaa-1");
    expect(mine.shots.find((s) => s.templateKey === "varmala")).toMatchObject({ votes: 2, mine: true });
    expect(mine.shots.find((s) => s.templateKey === "entry")).toMatchObject({ votes: 1, mine: false });
    expect(getProjectState(db, id).votes).toEqual({ varmala: 2, entry: 1 });
    const recent = getProjectState(db, id).recentVotes;
    expect(recent).toHaveLength(3);
    expect(recent.some((v) => v.voterName === "Asha aunty" && v.templateKey === "varmala")).toBe(true);

    castVote(db, token, { templateKey: "varmala", voterId: "voter-aaaa-1", love: false });
    expect(getProjectState(db, id).votes.varmala).toBe(1);
  });

  it("refuses votes on shots outside the couple's tradition", () => {
    const id = createProject(db, { brideName: "Lata", groomName: "Om" }).id;
    const token = getOrCreateShareToken(db, id);
    expect(() => castVote(db, token, { templateKey: "thali", voterId: "voter-cccc-3", love: true })).toThrow(UserError);
  });
});

describe("links that open on a phone", () => {
  it("uses the address the request came in on", () => {
    expect(publicBaseUrl(new Request("https://preview.example.com/api/x"))).toBe("https://preview.example.com");
  });

  it("swaps localhost for this computer's Wi-Fi address when there is one", () => {
    const base = publicBaseUrl(new Request("http://localhost:3000/api/x"));
    const lan = lanAddress();
    expect(base).toBe(lan ? `http://${lan}:3000` : "http://localhost:3000");
  });
});
