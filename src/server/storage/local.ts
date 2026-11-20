import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@/server/env";

/**
 * Saves files on the server's disk under STORAGE_DIR.
 *
 * Every file is addressed by a relative path such as
 * "projects/<projectId>/shots/<uuid>.jpg". The browser loads it through
 * GET /api/files/<relative path>.
 *
 * To move to cloud storage (S3, R2, GCS) later, keep these four function
 * signatures and replace their bodies. Nothing else in the app touches the disk.
 */

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "mp4"]);

function root(): string {
  return path.resolve(env.STORAGE_DIR);
}

/** Turns a relative path into an absolute one, refusing anything outside STORAGE_DIR. */
export function resolveSafe(relativePath: string): string {
  const base = root();
  const full = path.resolve(base, relativePath);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("Path is outside the storage folder");
  }
  return full;
}

export async function saveFile(folder: string, ext: string, data: Buffer): Promise<string> {
  const clean = ext.toLowerCase().replace(/^\./, "");
  if (!ALLOWED_EXT.has(clean)) throw new Error(`File type .${clean} is not allowed`);
  const relative = path.posix.join(folder, `${randomUUID()}.${clean}`);
  const full = resolveSafe(relative);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
  return relative;
}

export async function readFile(relativePath: string): Promise<Buffer> {
  return fs.readFile(resolveSafe(relativePath));
}

export async function deleteFile(relativePath: string): Promise<void> {
  await fs.rm(resolveSafe(relativePath), { force: true });
}

/** URL the browser uses to load a stored file. */
export function fileUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  return `/api/files/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
}

export function contentTypeFor(relativePath: string): string {
  const ext = path.extname(relativePath).slice(1).toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}
