/**
 * The wedding film's timeline, as plain data and maths (no DOM), so it can be
 * unit-tested. `drawFrame` in ./draw.ts turns a moment of the timeline into pixels.
 *
 * Shape of the film:
 *   title card → one scene per drawn shot (slow pan and zoom) → end card
 * Neighbouring scenes overlap by FADE_S seconds and cross-fade.
 */

export const TITLE_S = 3.2;
export const SHOT_S = 3.8;
export const END_S = 3.4;
export const FADE_S = 0.8;

export interface FilmShot {
  key: string;
  name: string;
  url: string;
}

/** A slow "Ken Burns" camera move over a still: scale and centre (0–1) at the start and end. */
export interface CameraPath {
  from: { scale: number; x: number; y: number };
  to: { scale: number; x: number; y: number };
}

export type FilmScene =
  | { kind: "title"; start: number; end: number }
  | { kind: "shot"; start: number; end: number; shot: FilmShot; index: number; path: CameraPath }
  | { kind: "end"; start: number; end: number };

export interface Film {
  scenes: FilmScene[];
  duration: number;
}

/** Camera moves used in turn, so no two neighbouring shots move the same way. */
export const CAMERA_PATHS: CameraPath[] = [
  { from: { scale: 1.0, x: 0.5, y: 0.5 }, to: { scale: 1.14, x: 0.5, y: 0.45 } }, // slow push in
  { from: { scale: 1.12, x: 0.42, y: 0.5 }, to: { scale: 1.12, x: 0.58, y: 0.5 } }, // pan left to right
  { from: { scale: 1.18, x: 0.5, y: 0.42 }, to: { scale: 1.02, x: 0.5, y: 0.52 } }, // pull back
  { from: { scale: 1.1, x: 0.58, y: 0.55 }, to: { scale: 1.16, x: 0.44, y: 0.48 } }, // drift
];

export function buildFilm(shots: FilmShot[]): Film {
  const scenes: FilmScene[] = [{ kind: "title", start: 0, end: TITLE_S }];
  let cursor = TITLE_S - FADE_S;
  shots.forEach((shot, index) => {
    const path = CAMERA_PATHS[index % CAMERA_PATHS.length]!;
    scenes.push({ kind: "shot", start: cursor, end: cursor + SHOT_S, shot, index, path });
    cursor += SHOT_S - FADE_S;
  });
  scenes.push({ kind: "end", start: cursor, end: cursor + END_S });
  return { scenes, duration: cursor + END_S };
}

/** 0 → 1 while a scene fades in, 1 while it plays, 1 → 0 while it fades out. */
export function sceneOpacity(scene: FilmScene, t: number, duration: number): number {
  if (t < scene.start || t > scene.end) return 0;
  const fadeIn = scene.start <= 0 ? 1 : Math.min(1, (t - scene.start) / FADE_S);
  const fadeOut = scene.end >= duration ? 1 : Math.min(1, (scene.end - t) / FADE_S);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

/** Scenes visible at time t, oldest first (draw in this order). */
export function scenesAt(film: Film, t: number): FilmScene[] {
  return film.scenes.filter((s) => t >= s.start && t <= s.end);
}

/** Smooth ease for camera moves (no sudden start or stop). */
export const easeInOut = (p: number): number => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

/** Camera position for a shot scene at time t. */
export function cameraAt(scene: Extract<FilmScene, { kind: "shot" }>, t: number) {
  const p = easeInOut(Math.max(0, Math.min(1, (t - scene.start) / (scene.end - scene.start))));
  const { from, to } = scene.path;
  return {
    scale: from.scale + (to.scale - from.scale) * p,
    x: from.x + (to.x - from.x) * p,
    y: from.y + (to.y - from.y) * p,
  };
}
