import { getDb } from "@/server/db/client";
import { json, route, type Params } from "@/server/http";
import { getSharedView } from "@/server/services/share";

/** GET /api/share/:token?voter=<id>: the shots and vote counts shown on the family page. */
export const GET = route(async (req, { params }: Params<{ token: string }>) => {
  const { token } = await params;
  const voter = new URL(req.url).searchParams.get("voter") ?? undefined;
  return json(getSharedView(getDb(), token, voter));
});
