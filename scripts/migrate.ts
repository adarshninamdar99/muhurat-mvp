/**
 * Applies database migrations from /drizzle.
 * The app also does this automatically at start-up; this script is for
 * deployments that want to migrate as a separate step.
 *
 *   npm run db:migrate
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const file = process.env.DATABASE_PATH ?? "./data/muhurat.db";
fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
const sqlite = new Database(file);
migrate(drizzle(sqlite), { migrationsFolder: path.join(process.cwd(), "drizzle") });
sqlite.close();
console.log(`Database is up to date: ${file}`);
