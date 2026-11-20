/**
 * Draws a save-the-date card (1080 × 1350, the Instagram portrait size) onto a canvas.
 * The top is the couple's drawn picture; the bottom is cream paper with their names.
 */

export const CARD_W = 1080;
export const CARD_H = 1350;

const PAPER = "#FBF9F5";
const INK = "#1F1A17";
const SINDOOR = "#A8251C";
const HALDI = "#C8912E";
const DISPLAY = '"Bodoni Moda", Georgia, serif';
const BODY = '"Work Sans", system-ui, sans-serif';

export interface CardText {
  bride: string;
  groom: string;
  /** Already formatted, e.g. "Sunday, 14 February 2027". Empty to leave out. */
  date: string;
  city: string;
}

export function drawSaveTheDate(ctx: CanvasRenderingContext2D, photo: HTMLImageElement | null, text: CardText) {
  const photoH = 790;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Photo, inset like a print on card stock.
  const m = 48;
  if (photo) {
    const boxW = CARD_W - m * 2;
    const boxH = photoH - m;
    const s = Math.max(boxW / photo.naturalWidth, boxH / photo.naturalHeight);
    const w = photo.naturalWidth * s;
    const h = photo.naturalHeight * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(m, m, boxW, boxH);
    ctx.clip();
    ctx.drawImage(photo, m + (boxW - w) / 2, m + (boxH - h) / 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = "#efe8dc";
    ctx.fillRect(m, m, CARD_W - m * 2, photoH - m);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const cx = CARD_W / 2;

  ctx.fillStyle = SINDOOR;
  ctx.font = `600 24px ${BODY}`;
  ctx.fillText("S A V E   T H E   D A T E", cx, photoH + 82);

  // Names: "Bride & Groom" with an italic ampersand, shrunk to fit.
  let size = 96;
  const widthAt = (s: number) => {
    ctx.font = `400 ${s}px ${DISPLAY}`;
    const names = ctx.measureText(text.bride).width + ctx.measureText(text.groom).width;
    ctx.font = `italic 400 ${s}px ${DISPLAY}`;
    return names + ctx.measureText(" & ").width;
  };
  while (size > 48 && widthAt(size) > CARD_W - 140) size -= 4;
  const total = widthAt(size);
  let x = cx - total / 2;
  const y = photoH + 82 + 30 + size;
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = `400 ${size}px ${DISPLAY}`;
  ctx.fillText(text.bride, x, y);
  x += ctx.measureText(text.bride).width;
  ctx.font = `italic 400 ${size}px ${DISPLAY}`;
  ctx.fillStyle = SINDOOR;
  ctx.fillText(" & ", x, y);
  x += ctx.measureText(" & ").width;
  ctx.fillStyle = INK;
  ctx.font = `400 ${size}px ${DISPLAY}`;
  ctx.fillText(text.groom, x, y);
  ctx.textAlign = "center";

  // A small motif: three haldi diamonds on a rule.
  const ry = y + 52;
  ctx.strokeStyle = HALDI;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 140, ry);
  ctx.lineTo(cx - 34, ry);
  ctx.moveTo(cx + 34, ry);
  ctx.lineTo(cx + 140, ry);
  ctx.stroke();
  ctx.fillStyle = HALDI;
  for (const dx of [-18, 0, 18]) diamond(ctx, cx + dx, ry, dx === 0 ? 7 : 4.5);

  ctx.fillStyle = INK;
  ctx.font = `italic 400 40px ${DISPLAY}`;
  if (text.date) ctx.fillText(text.date, cx, ry + 74);
  ctx.fillStyle = "#6b625a";
  ctx.font = `500 26px ${BODY}`;
  if (text.city) ctx.fillText(text.city.toUpperCase().split("").join(" "), cx, ry + (text.date ? 124 : 74));

  ctx.fillStyle = "#9d9488";
  ctx.font = `400 18px ${BODY}`;
  ctx.fillText("Formal invitation to follow  ·  A Lovers Card", cx, CARD_H - 40);
  ctx.textAlign = "left";
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

/** "2027-02-14" → "Sunday, 14 February 2027" (Indian English order). */
export function formatCardDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
