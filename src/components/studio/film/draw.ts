import { cameraAt, sceneOpacity, scenesAt, type Film, type FilmScene } from "./timeline";

/** Words printed on the title and end cards. */
export interface FilmText {
  bride: string;
  groom: string;
  /** e.g. "A North Indian wedding" */
  kicker: string;
  /** e.g. "Golden hour · Palace courtyard" */
  detail: string;
}

export const FILM_W = 1280;
export const FILM_H = 720;

const PAPER = "#FBF9F5";
const INK = "#1F1A17";
const SINDOOR = "#A8251C";
const DISPLAY = '"Bodoni Moda", Georgia, serif';
const BODY = '"Work Sans", system-ui, sans-serif';

/** Draws the film at time t (seconds) onto a FILM_W × FILM_H canvas. */
export function drawFrame(ctx: CanvasRenderingContext2D, film: Film, t: number, images: Map<string, HTMLImageElement>, text: FilmText) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, FILM_W, FILM_H);
  for (const scene of scenesAt(film, t)) {
    ctx.globalAlpha = sceneOpacity(scene, t, film.duration);
    drawScene(ctx, scene, t, images, text);
  }
  ctx.globalAlpha = 1;
}

function drawScene(ctx: CanvasRenderingContext2D, scene: FilmScene, t: number, images: Map<string, HTMLImageElement>, text: FilmText) {
  if (scene.kind === "title") return drawCard(ctx, text.kicker, `${text.bride} & ${text.groom}`, text.detail);
  if (scene.kind === "end") return drawCard(ctx, "Coming soon", "Save the date", `${text.bride} & ${text.groom}`);

  const img = images.get(scene.shot.key);
  if (img) {
    const cam = cameraAt(scene, t);
    // Cover the frame, then apply the camera's zoom and centre.
    const cover = Math.max(FILM_W / img.naturalWidth, FILM_H / img.naturalHeight) * cam.scale;
    const w = img.naturalWidth * cover;
    const h = img.naturalHeight * cover;
    const x = clamp(FILM_W / 2 - cam.x * w, FILM_W - w, 0);
    const y = clamp(FILM_H / 2 - cam.y * h, FILM_H - h, 0);
    ctx.drawImage(img, x, y, w, h);
  }

  // A soft shade at the bottom so the caption reads on any picture.
  const shade = ctx.createLinearGradient(0, FILM_H * 0.62, 0, FILM_H);
  shade.addColorStop(0, "rgba(20,15,12,0)");
  shade.addColorStop(1, "rgba(20,15,12,0.62)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, FILM_H * 0.62, FILM_W, FILM_H * 0.38);

  // Thin letterbox bars give the cinema feel.
  ctx.fillStyle = "#0e0b09";
  ctx.fillRect(0, 0, FILM_W, 34);
  ctx.fillRect(0, FILM_H - 34, FILM_W, 34);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(251,249,245,0.78)";
  ctx.font = `500 15px ${BODY}`;
  ctx.fillText(String(scene.index + 1).padStart(2, "0"), 64, FILM_H - 104);
  ctx.fillStyle = PAPER;
  ctx.font = `italic 400 44px ${DISPLAY}`;
  ctx.fillText(scene.shot.name, 64, FILM_H - 62);
}

/** A cream card with a small red line, a big serif line and a quiet detail line. */
function drawCard(ctx: CanvasRenderingContext2D, kicker: string, title: string, detail: string) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, FILM_W, FILM_H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = SINDOOR;
  ctx.font = `600 15px ${BODY}`;
  ctx.fillText(spaced(kicker.toUpperCase()), FILM_W / 2, 282);

  ctx.fillStyle = INK;
  ctx.font = `400 ${fitSize(ctx, title, 84, FILM_W - 200)}px ${DISPLAY}`;
  ctx.fillText(title, FILM_W / 2, 380);

  ctx.strokeStyle = SINDOOR;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(FILM_W / 2 - 36, 418);
  ctx.lineTo(FILM_W / 2 + 36, 418);
  ctx.stroke();

  ctx.fillStyle = "#6b625a";
  ctx.font = `italic 400 24px ${DISPLAY}`;
  ctx.fillText(detail, FILM_W / 2, 466);
  ctx.textAlign = "left";
}

function fitSize(ctx: CanvasRenderingContext2D, text: string, size: number, maxWidth: number): number {
  let s = size;
  ctx.font = `400 ${s}px ${DISPLAY}`;
  while (s > 32 && ctx.measureText(text).width > maxWidth) {
    s -= 4;
    ctx.font = `400 ${s}px ${DISPLAY}`;
  }
  return s;
}

const spaced = (s: string) => s.split("").join(" ");
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
