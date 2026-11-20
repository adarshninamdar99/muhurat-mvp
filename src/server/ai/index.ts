import "server-only";
import { env } from "@/server/env";
import type { AiProvider } from "./types";

/**
 * Picks the AI provider from the AI_PROVIDER setting.
 * Providers are loaded lazily so demo mode never needs a fal.ai key.
 */
let cached: AiProvider | null = null;

export async function getAiProvider(): Promise<AiProvider> {
  if (cached) return cached;
  if (env.AI_PROVIDER === "fal") {
    cached = (await import("./providers/fal")).falProvider;
  } else {
    cached = (await import("./providers/mock")).mockProvider;
  }
  return cached;
}

/** For tests: force a provider. */
export function setAiProviderForTests(provider: AiProvider | null): void {
  cached = provider;
}

export type { AiProvider } from "./types";
