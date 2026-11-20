import { getDb } from "@/server/db/client";
import { json, route, type Params } from "@/server/http";
import { UserError } from "@/server/services/errors";
import { clearVenuePhoto, getProjectState, setVenuePhoto } from "@/server/services/projects";

/** POST /api/projects/:id/venue: multipart form with `file`. Starts depth analysis. */
export const POST = route(async (req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new UserError("Choose a venue photo to upload.");
  const db = getDb();
  await setVenuePhoto(db, id, file);
  return json(getProjectState(db, id), 201);
});

/** DELETE /api/projects/:id/venue: go back to using a preset venue. */
export const DELETE = route(async (_req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const db = getDb();
  await clearVenuePhoto(db, id);
  return json(getProjectState(db, id));
});
