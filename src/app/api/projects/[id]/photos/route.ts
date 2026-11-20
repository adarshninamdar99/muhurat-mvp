import { z } from "zod";
import { getDb } from "@/server/db/client";
import { json, route, type Params } from "@/server/http";
import { UserError } from "@/server/services/errors";
import { addPhoto, getProjectState } from "@/server/services/projects";

/** POST /api/projects/:id/photos: multipart form with `person` ("bride" | "groom") and `file`. */
export const POST = route(async (req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const form = await req.formData();
  const person = z.enum(["bride", "groom"]).parse(form.get("person"));
  const file = form.get("file");
  if (!(file instanceof File)) throw new UserError("Choose a photo to upload.");
  const db = getDb();
  await addPhoto(db, id, person, file);
  return json(getProjectState(db, id), 201);
});
