import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { catalog } from "@/config/catalog";
import type { DB } from "@/server/db/client";
import { projects, shots, votes } from "@/server/db/schema";
import { fileUrl } from "@/server/storage/local";
import { newId, now } from "@/lib/ids";
import type { SharedView } from "@/lib/types";
import { NotFoundError, UserError } from "./errors";
import { requireProject, voteCounts } from "./projects";

/**
 * The family share page.
 *
 * The couple gets a secret link (/share/<token>). Anyone with the link can see
 * the drawn shots and tap "love it" on their favourites. The link cannot change
 * the project: the studio lives at a different, private address.
 */

/** Returns the project's share token, making one the first time. */
export function getOrCreateShareToken(db: DB, projectId: string): string {
  const project = requireProject(db, projectId);
  if (project.shareToken) return project.shareToken;
  const token = randomBytes(12).toString("base64url");
  db.update(projects).set({ shareToken: token, updatedAt: now() }).where(eq(projects.id, projectId)).run();
  return token;
}

function projectByToken(db: DB, token: string) {
  const project = db.select().from(projects).where(eq(projects.shareToken, token)).get();
  if (!project) throw new NotFoundError("This share link is not valid any more.");
  return project;
}

/** What the share page shows. `voterId` marks which shots this visitor already loved. */
export function getSharedView(db: DB, token: string, voterId?: string): SharedView {
  const project = projectByToken(db, token);
  const tradition = catalog.tradition(project.traditionKey);
  const drawn = db.select().from(shots).where(eq(shots.projectId, project.id)).all();
  const counts = voteCounts(db, project.id);
  const mine = voterId
    ? new Set(
        db
          .select({ key: votes.templateKey })
          .from(votes)
          .where(and(eq(votes.projectId, project.id), eq(votes.voterId, voterId)))
          .all()
          .map((v) => v.key),
      )
    : new Set<string>();

  return {
    brideName: project.brideName,
    groomName: project.groomName,
    traditionName: tradition.name,
    timeName: catalog.time(project.timeKey).name,
    venueName: project.venuePhotoPath ? "Our venue" : catalog.venue(project.venueKey).name,
    shots: tradition.shots.flatMap((key) => {
      const shot = drawn.find((s) => s.templateKey === key && s.status === "done" && s.imagePath);
      if (!shot) return [];
      return [{ templateKey: key, name: catalog.shot(key).name, url: fileUrl(shot.imagePath)!, votes: counts[key] ?? 0, mine: mine.has(key) }];
    }),
  };
}

/** Adds or removes one visitor's "love it" on one shot. Safe to repeat. */
export function castVote(
  db: DB,
  token: string,
  input: { templateKey: string; voterId: string; voterName?: string; love: boolean },
): void {
  const project = projectByToken(db, token);
  if (!catalog.tradition(project.traditionKey).shots.includes(input.templateKey)) {
    throw new UserError("That shot is not part of this preview.");
  }
  const where = and(eq(votes.projectId, project.id), eq(votes.templateKey, input.templateKey), eq(votes.voterId, input.voterId));
  if (!input.love) {
    db.delete(votes).where(where).run();
    return;
  }
  db.insert(votes)
    .values({
      id: newId(),
      projectId: project.id,
      templateKey: input.templateKey,
      voterId: input.voterId,
      voterName: input.voterName?.trim() || null,
      createdAt: now(),
    })
    .onConflictDoNothing()
    .run();
}
