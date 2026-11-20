/**
 * Shapes of data sent from the server to the browser.
 * The studio screens read ProjectState; the API returns it after every change.
 */

export interface Selections {
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
  /** Cost of one picture / one clip in ₹ with the current provider (0 in demo mode). */
  prices: { imageInr: number; clipInr: number };
  provider: "fal" | "mock";
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
