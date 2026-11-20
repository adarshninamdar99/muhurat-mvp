import { getDb } from "@/server/db/client";
import { json, route, type Params } from "@/server/http";
import { requireProject, selectionsOf } from "@/server/services/projects";
import { buildQuote } from "@/server/services/quote";
import { createQuoteRequest } from "@/server/services/quoteRequests";

/** GET /api/projects/:id/quote: priced décor list for the current look. */
export const GET = route(async (_req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  return json(buildQuote(selectionsOf(requireProject(getDb(), id))));
});

/** POST /api/projects/:id/quote: save a request for vendor quotes. */
export const POST = route(async (_req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  return json(createQuoteRequest(getDb(), id), 201);
});
