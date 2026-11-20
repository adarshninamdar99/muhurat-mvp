/**
 * What each AI call costs, in US dollars, as listed by the provider.
 * The app converts to rupees with USD_TO_INR and records every call,
 * so the admin page shows real spend per couple.
 *
 * Update these when fal.ai changes its prices (see docs/AI_PIPELINE.md).
 * Checked against fal.ai model pages in November 2026.
 */
export const PRICE_USD = {
  /** fal-ai/nano-banana/edit, per picture. */
  image: 0.0398,
  /** fal-ai/wan/v2.2-a14b/image-to-video/turbo, per 720p clip. */
  clip720p: 0.1,
  /** fal-ai/image-preprocessors/depth-anything/v2 (billed per compute second; effectively near zero). */
  depth: 0.0,
  /** Demo mode never costs anything. */
  mock: 0,
} as const;

/** Rough waits shown to users before a job starts, in seconds. */
export const TYPICAL_WAIT_S = {
  image: 15,
  clip: 60,
  depth: 5,
} as const;
