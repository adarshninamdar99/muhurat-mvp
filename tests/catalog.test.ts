import { describe, expect, it } from "vitest";
import * as C from "@/config/catalog";

describe("catalog", () => {
  const lists = {
    VENUES: C.VENUES,
    THEMES: C.THEMES,
    FLOWERS: C.FLOWERS,
    MANDAPS: C.MANDAPS,
    LIGHTS: C.LIGHTS,
    BRIDE_OUTFITS: C.BRIDE_OUTFITS,
    GROOM_OUTFITS: C.GROOM_OUTFITS,
    SHOT_TEMPLATES: C.SHOT_TEMPLATES,
    CAMERA_MOVES: C.CAMERA_MOVES,
  };

  it.each(Object.entries(lists))("%s has unique keys and a prompt", (_name, list) => {
    const keys = list.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const item of list) expect(item.prompt.length).toBeGreaterThan(5);
  });

  it("default selections all exist", () => {
    const d = C.DEFAULT_SELECTIONS;
    expect(() => {
      C.catalog.venue(d.venueKey);
      C.catalog.theme(d.themeKey);
      C.catalog.flower(d.flowerKey);
      C.catalog.mandap(d.mandapKey);
      C.catalog.light(d.lightKey);
      C.catalog.brideOutfit(d.brideOutfitKey);
      C.catalog.groomOutfit(d.groomOutfitKey);
    }).not.toThrow();
  });

  it("the anchor shot is the first template", () => {
    expect(C.ANCHOR_SHOT_KEY).toBe(C.SHOT_TEMPLATES[0]!.key);
  });

  it("unknown keys give a helpful error", () => {
    expect(() => C.catalog.theme("nope")).toThrow(/Unknown theme "nope"/);
  });
});
