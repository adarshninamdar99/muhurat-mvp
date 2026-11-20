import { describe, expect, it } from "vitest";
import { catalog } from "@/config/catalog";
import { buildClipPrompt, buildShotPrompt } from "@/server/ai/prompts";
import type { SceneContext } from "@/server/ai/types";

const scene = (overrides: Partial<SceneContext> = {}): SceneContext => ({
  brideName: "Priya",
  groomName: "Arjun",
  venue: catalog.venue("palace"),
  venueFromPhoto: false,
  theme: catalog.theme("marigold"),
  flower: catalog.flower("rose"),
  mandap: catalog.mandap("dome"),
  light: catalog.light("fairy"),
  brideOutfit: catalog.brideOutfit("ruby"),
  groomOutfit: catalog.groomOutfit("ivory"),
  template: catalog.shot("varmala"),
  ...overrides,
});

describe("buildShotPrompt", () => {
  it("numbers reference images in the order they are sent", () => {
    const prompt = buildShotPrompt(scene(), ["the bride, photo 1 (face reference)", "the groom, photo 1 (face reference)"]);
    expect(prompt).toContain("image 1 is the bride, photo 1");
    expect(prompt).toContain("image 2 is the groom, photo 1");
    expect(prompt).toContain("Keep the bride's and groom's faces");
  });

  it("describes the chosen moment, décor and outfits", () => {
    const prompt = buildShotPrompt(scene(), []);
    expect(prompt).toContain(catalog.shot("varmala").prompt);
    expect(prompt).toContain("red rose garlands");
    expect(prompt).toContain(catalog.brideOutfit("ruby").prompt);
    expect(prompt).toContain(catalog.groomOutfit("ivory").prompt);
  });

  it("uses the preset venue text when there is no venue photo", () => {
    expect(buildShotPrompt(scene(), [])).toContain(catalog.venue("palace").prompt);
  });

  it("points to the venue photo when one is sent", () => {
    const prompt = buildShotPrompt(scene({ venueFromPhoto: true }), ["the bride, photo 1 (face reference)", "the wedding venue"]);
    expect(prompt).toContain("the real venue shown in image 2");
    expect(prompt).not.toContain(catalog.venue("palace").prompt);
  });

  it("asks to match the anchor shot when it is included", () => {
    const prompt = buildShotPrompt(scene(), ["the bride, photo 1 (face reference)", "an earlier photo from this same wedding"]);
    expect(prompt).toContain("Image 2 is from the same wedding");
  });
});

describe("buildClipPrompt", () => {
  it("includes the camera move", () => {
    const move = catalog.move("orbit");
    expect(buildClipPrompt(move, catalog.shot("pheras"))).toContain(move.prompt);
  });
});
