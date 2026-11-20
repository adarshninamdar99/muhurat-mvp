import type {
  BrideOutfit,
  CameraMove,
  DecorTheme,
  Flower,
  GroomOutfit,
  ShotTemplate,
  SimpleOption,
  VenuePreset,
} from "@/config/catalog";

/**
 * The contract every AI provider must follow.
 * Two providers ship with the app:
 *   - providers/fal   → real AI on fal.ai
 *   - providers/mock  → free demo mode that draws storyboard sketches
 * To add another (Replicate, your own GPU server…), implement AiProvider
 * and register it in ./index.ts. Nothing else needs to change.
 */
export interface AiProvider {
  readonly name: "fal" | "mock";
  /** Makes a depth map from the venue photo (lighter = closer). */
  analyzeVenue(input: { photo: ReferenceImage }): Promise<GeneratedFile>;
  /** Makes one wedding picture from reference photos and a prompt. */
  generateShot(input: ShotRequest): Promise<GeneratedFile>;
  /** Turns one picture into a short video clip. */
  generateClip(input: ClipRequest): Promise<GeneratedClip>;
}

/** An image sent to the model, with a plain description of what it shows. */
export interface ReferenceImage {
  label: string;
  data: Buffer;
  contentType: string;
}

/** Everything about the shot, resolved from the catalog. */
export interface SceneContext {
  brideName: string;
  groomName: string;
  venue: VenuePreset;
  venueFromPhoto: boolean;
  theme: DecorTheme;
  flower: Flower;
  mandap: SimpleOption;
  light: SimpleOption;
  brideOutfit: BrideOutfit;
  groomOutfit: GroomOutfit;
  template: ShotTemplate;
}

export interface ShotRequest {
  prompt: string;
  references: ReferenceImage[];
  /** Structured details; the demo provider draws from these, real providers use the prompt. */
  scene: SceneContext;
}

export interface ClipRequest {
  prompt: string;
  still: ReferenceImage;
  move: CameraMove;
}

export interface GeneratedFile {
  data: Buffer;
  /** File extension to save with, e.g. "jpg". */
  ext: "jpg" | "png" | "mp4";
  model: string;
  costUsd: number;
}

export type GeneratedClip =
  | ({ kind: "video" } & GeneratedFile)
  /** Demo mode: no video file; the screen animates the still. */
  | { kind: "preview"; model: string; costUsd: number };
