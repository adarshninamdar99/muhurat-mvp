/**
 * Shapes of data sent from the server to the browser.
 * The studio screens read ProjectState; the API returns it after every change.
 */

export interface Selections {
  traditionKey: string;
  timeKey: string;
  venueKey: string;
  themeKey: string;
  flowerKey: string;
  mandapKey: string;
  lightKey: string;
  brideOutfitKey: string;
  groomOutfitKey: string;
}

export interface PhotoDTO {
  id: string;
  person: "bride" | "groom";
  url: string;
}

export type WorkStatus = "queued" | "running" | "done" | "failed";

export interface ShotDTO {
  id: string;
  templateKey: string;
  status: WorkStatus;
  url: string | null;
  /** True when choices changed after this picture was made. */
  stale: boolean;
  error: string | null;
  updatedAt: number;
}

export interface ClipDTO {
  id: string;
  shotId: string;
  moveKey: string;
  status: WorkStatus;
  url: string | null;
  previewOnly: boolean;
  error: string | null;
  updatedAt: number;
}

export interface JobDTO {
  id: string;
  type: "analyze_venue" | "generate_shot" | "generate_clip";
  status: WorkStatus;
  progress: string | null;
  error: string | null;
}

export interface ProjectState {
  id: string;
  brideName: string;
  groomName: string;
  selections: Selections;
  venuePhotoUrl: string | null;
  venueDepthUrl: string | null;
  photos: PhotoDTO[];
  shots: ShotDTO[];
  clips: ClipDTO[];
  activeJobs: JobDTO[];
  spend: { images: number; clips: number; inr: number };
  /** Cost of one picture / one clip in ₹ with the current provider (0 when free). */
  prices: { imageInr: number; clipInr: number };
  provider: "fal" | "cloudflare" | "mock";
  /** What the current AI provider really does; screens label stand-ins honestly. */
  capabilities: { realPictures: boolean; realDepth: boolean; realVideo: boolean };
  /** Free-plan usage today (Cloudflare only). */
  allowance: { picturesToday: number; approxDailyLimit: number } | null;
  /** Family "love it" counts per shot template key, from the share page. */
  votes: Record<string, number>;
  /** Latest family votes, newest first (for the live feed on the Share step). */
  recentVotes: { id: string; templateKey: string; voterName: string | null; createdAt: number }[];
}

export interface QuoteLine {
  key: string;
  label: string;
  detail: string;
  low: number;
  high: number;
}

export interface Quote {
  lines: QuoteLine[];
  totalLow: number;
  totalHigh: number;
}

/** What the public family share page shows. */
export interface SharedView {
  brideName: string;
  groomName: string;
  traditionName: string;
  timeName: string;
  venueName: string;
  shots: { templateKey: string; name: string; url: string; votes: number; mine: boolean }[];
}
