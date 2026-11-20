import { z } from "zod";
import { SELECTION_KEYS } from "@/config/catalog";
import { getDb } from "@/server/db/client";
import { json, readJson, route, type Params } from "@/server/http";
import { getProjectState, updateProject } from "@/server/services/projects";

const oneOf = (keys: readonly string[]) => z.string().refine((v) => keys.includes(v), "Unknown option");

const patchSchema = z
  .object({
    brideName: z.string().trim().min(1).max(60),
    groomName: z.string().trim().min(1).max(60),
    traditionKey: oneOf(SELECTION_KEYS.traditionKey),
    timeKey: oneOf(SELECTION_KEYS.timeKey),
    venueKey: oneOf(SELECTION_KEYS.venueKey),
    themeKey: oneOf(SELECTION_KEYS.themeKey),
    flowerKey: oneOf(SELECTION_KEYS.flowerKey),
    mandapKey: oneOf(SELECTION_KEYS.mandapKey),
    lightKey: oneOf(SELECTION_KEYS.lightKey),
    brideOutfitKey: oneOf(SELECTION_KEYS.brideOutfitKey),
    groomOutfitKey: oneOf(SELECTION_KEYS.groomOutfitKey),
  })
  .partial()
  .strict();

/** GET /api/projects/:id: everything the studio needs (polled while jobs run). */
export const GET = route(async (_req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  return json(getProjectState(getDb(), id));
});

/** PATCH /api/projects/:id: change names or choices. Body: any subset of the fields above. */
export const PATCH = route(async (req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const changes = await readJson(req, patchSchema);
  const db = getDb();
  updateProject(db, id, changes);
  return json(getProjectState(db, id));
});
