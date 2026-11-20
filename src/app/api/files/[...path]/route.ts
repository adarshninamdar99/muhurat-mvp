import { contentTypeFor, readFile } from "@/server/storage/local";
import type { Params } from "@/server/http";

/**
 * GET /api/files/<relative path>: serves stored photos, pictures and clips.
 * Paths are checked so nothing outside STORAGE_DIR can be read.
 */
export async function GET(_req: Request, { params }: Params<{ path: string[] }>): Promise<Response> {
  const { path } = await params;
  const relative = path.map(decodeURIComponent).join("/");
  try {
    const data = await readFile(relative);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeFor(relative),
        // File names are random UUIDs and never reused, so they can be cached for a long time.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
