import { describe, expect, it } from "vitest";
import { buildFilm, cameraAt, easeInOut, END_S, FADE_S, sceneOpacity, scenesAt, SHOT_S, TITLE_S } from "@/components/studio/film/timeline";
import { formatCardDate } from "@/components/studio/share/saveTheDate";

const shots = ["entry", "varmala", "pheras"].map((key) => ({ key, name: key, url: `/x/${key}.jpg` }));

describe("wedding film timeline", () => {
  it("runs title → each shot → end card, with cross-fades between them", () => {
    const film = buildFilm(shots);
    expect(film.scenes.map((s) => s.kind)).toEqual(["title", "shot", "shot", "shot", "end"]);
    expect(film.duration).toBeCloseTo(TITLE_S + 3 * SHOT_S + END_S - 4 * FADE_S);
    for (let i = 1; i < film.scenes.length; i++) {
      expect(film.scenes[i - 1]!.end - film.scenes[i]!.start).toBeCloseTo(FADE_S);
    }
  });

  it("fades scenes in and out, but not the very first and last frames", () => {
    const film = buildFilm(shots);
    const [title, first] = film.scenes;
    expect(sceneOpacity(title!, 0, film.duration)).toBe(1);
    expect(sceneOpacity(first!, first!.start, film.duration)).toBe(0);
    expect(sceneOpacity(first!, first!.start + FADE_S / 2, film.duration)).toBeCloseTo(0.5);
    expect(sceneOpacity(film.scenes.at(-1)!, film.duration, film.duration)).toBe(1);
    expect(scenesAt(film, first!.start + 0.1)).toHaveLength(2); // mid cross-fade
  });

  it("moves the camera smoothly from start to end", () => {
    const film = buildFilm(shots);
    const scene = film.scenes[1]!;
    if (scene.kind !== "shot") throw new Error("expected a shot");
    expect(cameraAt(scene, scene.start)).toEqual(scene.path.from);
    expect(cameraAt(scene, scene.end).scale).toBeCloseTo(scene.path.to.scale);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });
});

describe("save-the-date card", () => {
  it("writes the date the Indian way", () => {
    expect(formatCardDate("2027-02-14")).toBe("Sunday, 14 February 2027");
    expect(formatCardDate("")).toBe("");
    expect(formatCardDate("14/02/2027")).toBe("");
  });
});
