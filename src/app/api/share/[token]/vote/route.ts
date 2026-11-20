import { z } from "zod";
import { getDb } from "@/server/db/client";
import { json, readJson, route, type Params } from "@/server/http";
import { castVote, getSharedView } from "@/server/services/share";

const schema = z.object({
  templateKey: z.string().min(1).max(40),
  voterId: z.string().min(8).max(64),
  voterName: z.string().max(40).optional(),
  love: z.boolean(),
});

/** POST /api/share/:token/vote: love (or un-love) a shot. Body: { templateKey, voterId, voterName?, love } */
export const POST = route(async (req, { params }: Params<{ token: string }>) => {
  const { token } = await params;
  const input = await readJson(req, schema);
  const db = getDb();
  castVote(db, token, input);
  return json(getSharedView(db, token, input.voterId));
});
