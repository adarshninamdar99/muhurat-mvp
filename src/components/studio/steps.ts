/** The seven studio steps, in order. The URL is /p/<projectId>/<key>. */
export const STEPS = [
  { key: "couple", title: "Couple" },
  { key: "venue", title: "Venue" },
  { key: "decor", title: "Décor" },
  { key: "outfits", title: "Outfits" },
  { key: "shots", title: "Shots" },
  { key: "video", title: "Video" },
  { key: "book", title: "Book" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export const isStepKey = (value: string): value is StepKey => STEPS.some((s) => s.key === value);
