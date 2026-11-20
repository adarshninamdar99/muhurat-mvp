import "server-only";
import { z } from "zod";

/**
 * All server settings, read once from environment variables and checked.
 * If a value is wrong the app stops at start-up with a clear message,
 * instead of failing later in the middle of a request.
 * See `.env.example` for what each setting means.
 */
const schema = z.object({
  AI_PROVIDER: z.enum(["mock", "cloudflare", "fal"]).default("mock"),
  FAL_KEY: z.string().optional().default(""),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional().default(""),
  CLOUDFLARE_API_TOKEN: z.string().optional().default(""),
  DATABASE_PATH: z.string().default("./data/muhurat.db"),
  STORAGE_DIR: z.string().default("./data/files"),
  ADMIN_PASSWORD: z.string().default("change-me"),
  USD_TO_INR: z.coerce.number().positive().default(88),
  JOB_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment settings: ${issues}`);
  }
  const env = parsed.data;
  if (env.AI_PROVIDER === "fal" && !env.FAL_KEY) {
    throw new Error("AI_PROVIDER is 'fal' but FAL_KEY is empty. Add your fal.ai key to .env.local or set AI_PROVIDER=mock.");
  }
  if (env.AI_PROVIDER === "cloudflare" && (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN)) {
    throw new Error(
      "AI_PROVIDER is 'cloudflare' but CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is empty. See docs/FREE_AI_SETUP.md, or set AI_PROVIDER=mock.",
    );
  }
  return env;
}

export const env: Env = load();
