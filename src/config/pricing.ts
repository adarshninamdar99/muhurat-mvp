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
  /** Cloudflare Workers AI within the free daily allowance. */
  cloudflareFree: 0,
  /** Demo mode never costs anything. */
  mock: 0,
} as const;

/**
 * Cloudflare's free plan gives 10,000 "neurons" a day, reset at 00:00 UTC (5:30 am IST).
 * One 1024×576 FLUX.2 Klein picture with 4 small reference images uses about 125
 * (26 per 512 px output tile × 4 tiles + about 5 per reference image), so roughly 80 pictures a day.
 */
export const CLOUDFLARE_FREE = {
  neuronsPerDay: 10_000,
  neuronsPerPicture: 125,
  get picturesPerDay() {
    return Math.floor(this.neuronsPerDay / this.neuronsPerPicture);
  },
} as const;

/** Rough waits shown to users before a job starts, in seconds. */
export const TYPICAL_WAIT_S = {
  image: 15,
  clip: 60,
  depth: 5,
} as const;
