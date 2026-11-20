import "server-only";
import type { DB } from "@/server/db/client";
import { quoteRequests } from "@/server/db/schema";
import { newId, now } from "@/lib/ids";
import { requireProject, selectionsOf } from "./projects";
import { buildQuote } from "./quote";

/** How many vendors a quote request goes to. */
export const VENDORS_PER_REQUEST = 3;

/**
 * Saves a quote request for the project's current look.
 * Sending it to real vendors is the next integration step: hook your vendor
 * notification (email, WhatsApp, A Lovers Card vendor dashboard) in here.
 */
export function createQuoteRequest(db: DB, projectId: string): { id: string; vendorCount: number } {
  const project = requireProject(db, projectId);
  const quote = buildQuote(selectionsOf(project));
  const id = newId();
  db.insert(quoteRequests)
    .values({
      id,
      projectId,
      items: JSON.stringify(quote.lines),
      totalLow: quote.totalLow,
      totalHigh: quote.totalHigh,
      vendorCount: VENDORS_PER_REQUEST,
      createdAt: now(),
    })
    .run();
  return { id, vendorCount: VENDORS_PER_REQUEST };
}
