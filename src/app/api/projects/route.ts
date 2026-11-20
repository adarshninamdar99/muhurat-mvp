import { z } from "zod";
import { getDb } from "@/server/db/client";
import { json, readJson, route } from "@/server/http";
import { createProject, listProjects } from "@/server/services/projects";

const createSchema = z.object({
  brideName: z.string().trim().min(1, "Enter the bride's name").max(60),
  groomName: z.string().trim().min(1, "Enter the groom's name").max(60),
});

/** GET /api/projects: recent previews. */
export const GET = route(async () => {
  const rows = listProjects(getDb());
  return json(rows.map((p) => ({ id: p.id, brideName: p.brideName, groomName: p.groomName, updatedAt: p.updatedAt })));
});

/** POST /api/projects: start a new preview. Body: { brideName, groomName } */
export const POST = route(async (req) => {
  const input = await readJson(req, createSchema);
  const project = createProject(getDb(), input);
  return json({ id: project.id }, 201);
});
