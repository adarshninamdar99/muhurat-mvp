import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { env } from "@/server/env";

export type DB = BetterSQLite3Database<typeof schema>;

/**
 * Opens the SQLite database and applies any pending migrations from /drizzle.
 * Kept on `globalThis` so Next.js hot reload in development does not open
 * a new connection on every file change.
 */
export function openDatabase(filePath: string): DB {
  if (filePath !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  const sqlite = new Database(filePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

const globalForDb = globalThis as unknown as { __muhuratDb?: DB };

export function getDb(): DB {
  if (!globalForDb.__muhuratDb) globalForDb.__muhuratDb = openDatabase(env.DATABASE_PATH);
  return globalForDb.__muhuratDb;
}

/** Tests swap in a temporary database with this. */
export function setDbForTests(db: DB): void {
  globalForDb.__muhuratDb = db;
}
