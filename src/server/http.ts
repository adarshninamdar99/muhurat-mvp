import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { UserError } from "@/server/services/errors";

/**
 * Wraps a route handler so every error becomes a clean JSON response:
 *   { "error": "message the user can read" }
 * Unexpected errors are logged and shown as a generic message.
 */
export function route<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) {
        return NextResponse.json({ error: "Some of the details sent were not valid.", issues: err.issues }, { status: 400 });
      }
      console.error("[api]", err);
      return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new UserError("The request body must be JSON.");
  }
  return schema.parse(body);
}

export function json(data: unknown, status = 200): Response {
  return NextResponse.json(data, { status });
}

/** Route params in Next.js 15 arrive as a Promise. */
export type Params<T extends Record<string, string | string[]>> = { params: Promise<T> };
