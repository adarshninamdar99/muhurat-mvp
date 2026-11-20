import type { CameraMove, ShotTemplate } from "@/config/catalog";
import type { SceneContext } from "./types";

/**
 * Builds the text instruction for one wedding picture.
 *
 * `referenceLabels` lists the reference images in the exact order they are
 * sent to the model, so the prompt can say "image 1 is the bride", etc.
 * Keep wording concrete: models follow plain descriptions better than adjectives.
 * Tune the wording here; tests in tests/prompts.test.ts check the structure.
 */
export function buildShotPrompt(scene: SceneContext, referenceLabels: string[]): string {
  const lines: string[] = [];
  lines.push("Create a photorealistic photograph from an Indian wedding.");

  if (referenceLabels.length > 0) {
    const list = referenceLabels.map((label, i) => `image ${i + 1} is ${label}`).join("; ");
    lines.push(`Reference images: ${list}.`);
  }

  const faceRefs = referenceLabels.some((l) => l.includes("bride")) || referenceLabels.some((l) => l.includes("groom"));
  if (faceRefs) {
    lines.push(
      "Keep the bride's and groom's faces, skin tone, hair and body shape exactly as in their reference photos. Do not change who they are.",
    );
  }

  lines.push(`Moment: ${scene.template.prompt}.`);

  const venueIndex = referenceLabels.findIndex((l) => l.startsWith("the wedding venue"));
  if (scene.venueFromPhoto && venueIndex >= 0) {
    lines.push(
      `Venue: the real venue shown in image ${venueIndex + 1}. Keep its architecture, layout, floor and surroundings; only add the wedding décor.`,
    );
  } else {
    lines.push(`Venue: ${scene.venue.prompt}.`);
  }

  lines.push(
    `Décor: ${scene.mandap.prompt}; ${scene.theme.prompt}; decorated with ${scene.flower.prompt}; lit by ${scene.light.prompt}.`,
  );
  lines.push(`The bride wears ${scene.brideOutfit.prompt}. The groom wears ${scene.groomOutfit.prompt}.`);

  const anchorIndex = referenceLabels.findIndex((l) => l.startsWith("an earlier photo"));
  if (anchorIndex >= 0) {
    lines.push(
      `Image ${anchorIndex + 1} is from the same wedding: match its décor, colours, flowers, outfits and lighting exactly, from this new camera angle.`,
    );
  }

  lines.push(
    "Style: natural professional wedding photography, soft flattering light, realistic skin texture, true-to-life colours, 16:9 landscape. No text, no watermark, no extra brides or grooms.",
  );
  return lines.join("\n");
}

/** Text instruction for turning a still into a short clip. */
export function buildClipPrompt(move: CameraMove, template: ShotTemplate): string {
  return [
    `Wedding video, ${template.name.toLowerCase()} moment.`,
    `${move.prompt}.`,
    "Keep the people's faces, outfits and the décor exactly as in the image. Realistic, smooth, no cuts, no text.",
  ].join(" ");
}
