import { z } from "zod";
import { getDb } from "@/server/db/client";
import { json, readJson, route, type Params } from "@/server/http";
import { requestClip } from "@/server/services/clips";
import { getProjectState } from "@/server/services/projects";

const schema = z.object({ shotId: z.string(), moveKey: z.string() });

/** POST /api/projects/:id/clips: make a 5-second clip. Body: { shotId, moveKey } */
export const POST = route(async (req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const { shotId, moveKey } = await readJson(req, schema);
  const db = getDb();
  requestClip(db, id, shotId, moveKey);
  return json(getProjectState(db, id), 202);
});
