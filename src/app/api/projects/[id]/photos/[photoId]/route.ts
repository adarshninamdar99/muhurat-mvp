import { getDb } from "@/server/db/client";
import { json, route, type Params } from "@/server/http";
import { getProjectState, removePhoto } from "@/server/services/projects";

/** DELETE /api/projects/:id/photos/:photoId */
export const DELETE = route(async (_req, { params }: Params<{ id: string; photoId: string }>) => {
  const { id, photoId } = await params;
  const db = getDb();
  await removePhoto(db, id, photoId);
  return json(getProjectState(db, id));
});
