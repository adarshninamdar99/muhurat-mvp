import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";

/** GET /api/health: for uptime checks. */
export async function GET(): Promise<Response> {
  getDb().run(sql`select 1`);
  return Response.json({ ok: true, provider: env.AI_PROVIDER });
}
