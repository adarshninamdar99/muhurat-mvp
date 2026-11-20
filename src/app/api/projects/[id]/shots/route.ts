import { z } from "zod";
import { getDb } from "@/server/db/client";
import { json, readJson, route, type Params } from "@/server/http";
import { getProjectState } from "@/server/services/projects";
import { requestShots } from "@/server/services/shots";

const schema = z.object({ templateKeys: z.array(z.string()).min(1).max(20) });

/** POST /api/projects/:id/shots: draw (or redraw) shots. Body: { templateKeys: ["entry", "varmala", ...] } */
export const POST = route(async (req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const { templateKeys } = await readJson(req, schema);
  const db = getDb();
  requestShots(db, id, templateKeys);
  return json(getProjectState(db, id), 202);
});
