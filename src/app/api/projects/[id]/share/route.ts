import { getDb } from "@/server/db/client";
import { json, route, type Params } from "@/server/http";
import { getOrCreateShareToken } from "@/server/services/share";

/** POST /api/projects/:id/share: get (or make) the family share link. Returns { path }. */
export const POST = route(async (_req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const token = getOrCreateShareToken(getDb(), id);
  return json({ path: `/share/${token}` });
});
