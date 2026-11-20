/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CATALOG — every choice a couple can make lives in this one file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  To add a new option (a décor theme, an outfit, a shot type…), copy an
 *  existing entry in the right list and change its values. The `key` must be
 *  unique and must never change once real projects use it, because saved
 *  projects store the key.
 *
 *  Each entry has:
 *    - fields for the screens (name, sub, swatches)
 *    - a `prompt` fragment that is sent to the AI model when pictures are made
 *    - colours used by demo mode to draw the storyboard sketch
 *
 *  This file is shared by the server and the browser, so keep it plain data
 *  (no secrets, no server-only imports).
 */

export type Swatch = string; // CSS hex colour

export interface VenuePreset {
  key: string;
  name: string;
  sub: string;
  prompt: string;
  /** Demo-mode colours: floor gradient, top then bottom. */
  floor: [Swatch, Swatch];
  /** Demo-mode sky / ceiling gradient, top to bottom. */
  sky: [Swatch, Swatch, Swatch];
}

export interface DecorTheme {
  key: string;
  name: string;
  sub: string;
  prompt: string;
  drape: Swatch;
  canopy: Swatch;
  pillar: Swatch;
  /** Multiplier used by the décor price estimate (1 = standard). */
  priceFactor: number;
}

export interface Flower {
  key: string;
  name: string;
  prompt: string;
  colors: [Swatch, Swatch];
  /** Indicative price per kg in ₹, used by the décor estimate. */
  ratePerKg: number;
}

export interface SimpleOption {
  key: string;
  name: string;
  sub: string;
  prompt: string;
}

export interface BrideOutfit {
  key: string;
  name: string;
  prompt: string;
  main: Swatch;
  trim: Swatch;
  veil: Swatch;
  /**
   * Optional catalogue photo, e.g. "/catalog/outfits/red-lehenga.jpg" placed in
   * `public/catalog/outfits/`. When present it is sent to the AI as a reference
   * so the outfit matches the real product.
   */
  referenceImage?: string;
  /** Optional link to the product on A Lovers Card. */
  productUrl?: string;
}

export interface GroomOutfit {
  key: string;
  name: string;
  prompt: string;
  coat: Swatch;
  trim: Swatch;
  safa: Swatch;
  referenceImage?: string;
  productUrl?: string;
}

export interface ShotTemplate {
  key: string;
  name: string;
  /** Short camera description shown under the shot title. */
  framing: string;
  /** What happens in the shot, sent to the AI. */
  prompt: string;
  /** Demo-mode camera: zoom and centre point in a 1600×900 scene. */
  camera: { zoom: number; cx: number; cy: number };
  /** Demo-mode couple position and spacing. */
  couple: { x: number; y: number; scale: number; gap: number };
  extras?: { garland?: boolean; fire?: boolean; sofa?: boolean; guests?: "aisle" | "family" };
}

/** A regional wedding tradition: decides which ritual shots are drawn. */
export interface Tradition {
  key: string;
  name: string;
  sub: string;
  /** Added to every prompt so clothing, rituals and décor details fit the tradition. */
  prompt: string;
  /** Shot template keys, in order. The first must be the anchor ("entry"). */
  shots: string[];
}

/** Ceremony time (the muhurat): decides the light in every picture. */
export interface CeremonyTime {
  key: string;
  name: string;
  sub: string;
  prompt: string;
  /** Demo-mode sky colours, top to bottom (overrides the venue's sky). */
  sky: [Swatch, Swatch, Swatch];
}

export interface CameraMove {
  key: string;
  name: string;
  sub: string;
  prompt: string;
}

export interface VendorLine {
  key: string;
  label: (sel: SelectionLabels) => string;
  detail: (sel: SelectionLabels) => string;
  /** Low and high estimate in ₹. */
  range: (sel: SelectionLabels) => [number, number];
}

/** Resolved names and numbers a vendor line can use. */
export interface SelectionLabels {
  theme: DecorTheme;
  flower: Flower;
  mandap: SimpleOption;
  light: SimpleOption;
}

// ─── Venues ──────────────────────────────────────────────────────────────────
// Presets are used when the couple has no venue photo yet.

export const VENUES: VenuePreset[] = [
  {
    key: "palace",
    name: "Palace courtyard",
    sub: "Sandstone arches, open sky",
    prompt: "an open-air Rajasthani palace courtyard with carved sandstone arches and a marble floor, at golden hour",
    floor: ["#d2c1a3", "#eadfcb"],
    sky: ["#f2e4d2", "#eccdb3", "#e4b48f"],
  },
  {
    key: "beach",
    name: "Beach",
    sub: "Mandap on the sand at sunset",
    prompt: "a beach in Goa at sunset with the mandap on the sand and the sea behind",
    floor: ["#d9bb86", "#ecd6ad"],
    sky: ["#dce8ee", "#efd8c6", "#f0c39c"],
  },
  {
    key: "banquet",
    name: "Banquet hall",
    sub: "Indoor, carpeted, chandeliers",
    prompt: "an elegant indoor banquet hall with a carpeted floor, panelled walls and warm lighting",
    floor: ["#6a2a35", "#8d3a48"],
    sky: ["#eee5df", "#e6d9d1", "#dccbc0"],
  },
  {
    key: "garden",
    name: "Garden lawn",
    sub: "Evening, string lights",
    prompt: "a green garden lawn in the evening surrounded by trees",
    floor: ["#5d8752", "#7ea56f"],
    sky: ["#e3ebe1", "#d8e3d4", "#c8d8c3"],
  },
  {
    key: "temple",
    name: "Temple hall",
    sub: "Carved stone pillars",
    prompt: "a South Indian temple hall with rows of carved stone pillars",
    floor: ["#a3855e", "#bfa078"],
    sky: ["#efe1cc", "#e5cfb1", "#d8bc95"],
  },
];

// ─── Décor ───────────────────────────────────────────────────────────────────

export const THEMES: DecorTheme[] = [
  {
    key: "marigold",
    name: "Marigold and red",
    sub: "Traditional, bright",
    prompt: "traditional décor in deep red and marigold gold, with brass accents",
    drape: "#b3123c",
    canopy: "#d9a441",
    pillar: "#f3e0b5",
    priceFactor: 1.15,
  },
  {
    key: "pastel",
    name: "Blush and peach",
    sub: "Soft, modern",
    prompt: "soft modern décor in blush pink, peach and white",
    drape: "#eeb3bf",
    canopy: "#f5dcc9",
    pillar: "#ffffff",
    priceFactor: 1.0,
  },
  {
    key: "ivory",
    name: "Ivory and green",
    sub: "Minimal, airy",
    prompt: "minimal décor in ivory and white with fresh greenery",
    drape: "#f3ecdf",
    canopy: "#ddd0b8",
    pillar: "#faf6ee",
    priceFactor: 0.85,
  },
  {
    key: "temple",
    name: "Maroon and brass",
    sub: "South Indian, banana leaf",
    prompt: "South Indian décor in maroon and brass with banana leaves and kolam patterns",
    drape: "#7a1f1f",
    canopy: "#c9952b",
    pillar: "#9a6a3b",
    priceFactor: 0.95,
  },
];

export const FLOWERS: Flower[] = [
  { key: "marigold", name: "Marigold", prompt: "marigold garlands", colors: ["#f0a020", "#e2601a"], ratePerKg: 300 },
  { key: "rose", name: "Red roses", prompt: "red rose garlands", colors: ["#c2185b", "#8e0e3c"], ratePerKg: 520 },
  { key: "orchid", name: "Orchids", prompt: "purple orchid arrangements", colors: ["#b06ad3", "#7d3c98"], ratePerKg: 900 },
  { key: "jasmine", name: "Jasmine", prompt: "white jasmine strings", colors: ["#fffdf6", "#efe8d6"], ratePerKg: 650 },
];

export const MANDAPS: SimpleOption[] = [
  { key: "dome", name: "Dome", sub: "Carved canopy", prompt: "a mandap with a carved dome canopy on four pillars" },
  { key: "arch", name: "Flower arch", sub: "Rounded, all flowers", prompt: "a mandap shaped as a rounded arch made entirely of flowers" },
  { key: "frame", name: "Square frame", sub: "Simple and clean", prompt: "a simple square-frame mandap with draped fabric" },
];

export const LIGHTS: SimpleOption[] = [
  { key: "fairy", name: "String lights", sub: "Warm, overhead", prompt: "warm string lights overhead" },
  { key: "diya", name: "Diyas", sub: "Brass lamps along the aisle", prompt: "brass diyas lining the aisle" },
  { key: "chandelier", name: "Chandelier", sub: "One large, centred", prompt: "one large crystal chandelier above the mandap" },
];

// ─── Outfits ─────────────────────────────────────────────────────────────────
// Add A Lovers Card listings here. A `referenceImage` makes the AI copy the real product.

export const BRIDE_OUTFITS: BrideOutfit[] = [
  { key: "ruby", name: "Red lehenga", prompt: "a deep red bridal lehenga with gold zari embroidery and a red dupatta", main: "#9e1030", trim: "#d9a441", veil: "#c2185b" },
  { key: "blush", name: "Blush lehenga", prompt: "a blush pink bridal lehenga with light gold work and a sheer pink dupatta", main: "#e3a0b0", trim: "#e9c98e", veil: "#f3c9d2" },
  { key: "kanjeevaram", name: "Kanjeevaram saree", prompt: "a cream Kanjeevaram silk saree with a wide gold border and a maroon pallu", main: "#eadbb5", trim: "#b8860b", veil: "#8f1d2c" },
  { key: "emerald", name: "Green lehenga", prompt: "an emerald green bridal lehenga with antique gold embroidery", main: "#1d6b52", trim: "#d4af37", veil: "#2e8b6d" },
];

export const GROOM_OUTFITS: GroomOutfit[] = [
  { key: "ivory", name: "Ivory sherwani", prompt: "an ivory sherwani with gold buttons, a red safa and a red stole", coat: "#efe6d2", trim: "#c9a24a", safa: "#b3123c" },
  { key: "navy", name: "Navy bandhgala", prompt: "a navy blue bandhgala with gold buttons and a gold safa", coat: "#26355a", trim: "#c9a24a", safa: "#d9a441" },
  { key: "gold", name: "Gold kurta", prompt: "a gold silk kurta with a cream dhoti and a cream safa", coat: "#d8b25a", trim: "#8a5a1f", safa: "#f3e0b5" },
  { key: "maroon", name: "Maroon sherwani", prompt: "a maroon velvet sherwani with a gold safa", coat: "#6b1a2a", trim: "#e0b45a", safa: "#e7c46b" },
];

// ─── Shots ───────────────────────────────────────────────────────────────────
// The first entry is the "anchor": it is made first, and every other shot uses
// it as a reference so décor and outfits stay the same.

export const SHOT_TEMPLATES: ShotTemplate[] = [
  {
    key: "entry",
    name: "Grand entry",
    framing: "Wide shot",
    prompt: "a wide shot of the couple walking together down the aisle towards the mandap, guests on both sides",
    camera: { zoom: 1, cx: 800, cy: 450 },
    couple: { x: 800, y: 830, scale: 1.15, gap: 70 },
    extras: { guests: "aisle" },
  },
  {
    key: "varmala",
    name: "Varmala",
    framing: "Medium shot",
    prompt: "a medium shot of the bride and groom facing each other at the mandap, exchanging flower garlands (varmala)",
    camera: { zoom: 1.45, cx: 800, cy: 540 },
    couple: { x: 800, y: 700, scale: 1, gap: 56 },
    extras: { garland: true },
  },
  {
    key: "pheras",
    name: "Pheras",
    framing: "Medium shot, low angle",
    prompt: "the couple walking around the sacred fire (havan kund) inside the mandap during the pheras, seen from a low angle",
    camera: { zoom: 1.55, cx: 800, cy: 580 },
    couple: { x: 800, y: 705, scale: 0.95, gap: 150 },
    extras: { fire: true },
  },
  {
    key: "portrait",
    name: "Couple portrait",
    framing: "Close-up",
    prompt: "a close-up portrait of the bride and groom standing together under the mandap, both looking at the camera and smiling",
    camera: { zoom: 2.5, cx: 800, cy: 545 },
    couple: { x: 800, y: 700, scale: 1, gap: 46 },
  },
  {
    key: "family",
    name: "Family photo",
    framing: "Wide group shot",
    prompt: "a wide group photo of the couple in the centre with their families standing around them at the mandap",
    camera: { zoom: 1.18, cx: 800, cy: 540 },
    couple: { x: 800, y: 710, scale: 1, gap: 60 },
    extras: { guests: "family" },
  },
  {
    key: "reception",
    name: "Reception",
    framing: "Medium wide, evening",
    prompt: "the couple standing in front of a decorated reception sofa on the stage in the evening",
    camera: { zoom: 1.3, cx: 800, cy: 520 },
    couple: { x: 800, y: 700, scale: 1, gap: 64 },
    extras: { sofa: true },
  },
  // ── Ritual moments used by specific traditions (see TRADITIONS) ──
  {
    key: "malai-maatral",
    name: "Malai maatral",
    framing: "Medium shot",
    prompt: "a medium shot of the bride and groom playfully exchanging heavy flower garlands (malai maatral) on the stage, relatives smiling behind them",
    camera: { zoom: 1.45, cx: 800, cy: 540 },
    couple: { x: 800, y: 700, scale: 1, gap: 56 },
    extras: { garland: true },
  },
  {
    key: "thali",
    name: "Thali tying",
    framing: "Close-up, eye level",
    prompt: "a close-up of the groom tying the sacred thali (mangalsutra) around the seated bride's neck at the auspicious moment, priests and family showering rice and flowers",
    camera: { zoom: 2.1, cx: 800, cy: 560 },
    couple: { x: 800, y: 700, scale: 1, gap: 50 },
    extras: { fire: true },
  },
  {
    key: "shubho-drishti",
    name: "Shubho drishti",
    framing: "Medium close-up",
    prompt: "the shubho drishti moment: the bride, lifted on a wooden piri, lowers the betel leaves covering her face and looks at the groom for the first time",
    camera: { zoom: 2, cx: 800, cy: 540 },
    couple: { x: 800, y: 700, scale: 1, gap: 60 },
  },
  {
    key: "sindoor-daan",
    name: "Sindoor daan",
    framing: "Close-up",
    prompt: "a close-up of the groom applying sindoor to the parting of the bride's hair during sindoor daan, the bride's head covered with a red veil",
    camera: { zoom: 2.4, cx: 800, cy: 545 },
    couple: { x: 800, y: 700, scale: 1, gap: 44 },
  },
  {
    key: "antarpat",
    name: "Antarpat",
    framing: "Medium shot",
    prompt: "the antarpat moment: a silk cloth held between the bride and groom by relatives as the mangalashtak is sung, just before it is lowered",
    camera: { zoom: 1.5, cx: 800, cy: 560 },
    couple: { x: 800, y: 700, scale: 1, gap: 90 },
  },
  {
    key: "saptapadi",
    name: "Saptapadi",
    framing: "Medium shot, low angle",
    prompt: "the couple taking the seven steps (saptapadi) together beside the sacred fire, the bride's foot touching small mounds of rice",
    camera: { zoom: 1.55, cx: 800, cy: 580 },
    couple: { x: 800, y: 705, scale: 0.95, gap: 150 },
    extras: { fire: true },
  },
];

// ─── Traditions ──────────────────────────────────────────────────────────────
// Each tradition picks six shots. Keep "entry" first (it is the anchor).

export const TRADITIONS: Tradition[] = [
  {
    key: "north",
    name: "North Indian",
    sub: "Varmala, pheras",
    prompt: "a North Indian Hindu wedding",
    shots: ["entry", "varmala", "pheras", "portrait", "family", "reception"],
  },
  {
    key: "south",
    name: "South Indian",
    sub: "Malai maatral, thali",
    prompt: "a South Indian Hindu wedding with banana trees, mango-leaf toranams and kolam patterns",
    shots: ["entry", "malai-maatral", "thali", "portrait", "family", "reception"],
  },
  {
    key: "bengali",
    name: "Bengali",
    sub: "Shubho drishti, sindoor daan",
    prompt: "a Bengali Hindu wedding with alpana patterns and a red-and-white colour palette in the details",
    shots: ["entry", "shubho-drishti", "sindoor-daan", "portrait", "family", "reception"],
  },
  {
    key: "marathi",
    name: "Marathi",
    sub: "Antarpat, saptapadi",
    prompt: "a Marathi Hindu wedding, the bride and groom wearing mundavalya (pearl strings) on their foreheads",
    shots: ["entry", "antarpat", "saptapadi", "portrait", "family", "reception"],
  },
];

// ─── Ceremony time (muhurat) ─────────────────────────────────────────────────

export const CEREMONY_TIMES: CeremonyTime[] = [
  { key: "dawn", name: "Dawn", sub: "Early muhurat, soft pink light", prompt: "at dawn, soft pink and pale blue early-morning light", sky: ["#e8d9e6", "#f4d6cf", "#f8e3c4"] },
  { key: "morning", name: "Morning", sub: "Bright, clear daylight", prompt: "in bright, clear morning daylight", sky: ["#dfeaf3", "#eef2f2", "#f6f0e2"] },
  { key: "golden", name: "Golden hour", sub: "Warm low sun before sunset", prompt: "at golden hour, warm low sunlight and long soft shadows", sky: ["#f2e4d2", "#eccdb3", "#e4b48f"] },
  { key: "night", name: "Night", sub: "Lamps and lights glowing", prompt: "at night, lit by warm lamps, glowing décor lights and a dark sky", sky: ["#1f2340", "#38345a", "#5a4467"] },
];

// ─── Video camera moves ──────────────────────────────────────────────────────

export const CAMERA_MOVES: CameraMove[] = [
  { key: "dolly", name: "Push in", sub: "Slowly towards the couple", prompt: "the camera slowly pushes in towards the couple; gentle natural movement of fabric and flowers" },
  { key: "orbit", name: "Circle", sub: "Half-circle around the mandap", prompt: "the camera moves in a slow half-circle around the couple and the mandap" },
  { key: "crane", name: "Crane down", sub: "From above to eye level", prompt: "the camera starts high and slowly cranes down to eye level with the couple" },
  { key: "pan", name: "Pan", sub: "Left to right across the venue", prompt: "the camera pans slowly from left to right across the decorated venue, ending on the couple" },
];

// ─── Décor price estimate ────────────────────────────────────────────────────
// Sample ranges until A Lovers Card supplies real vendor rates.

export const VENDOR_LINES: VendorLine[] = [
  {
    key: "mandap",
    label: (s) => `${s.mandap.name} mandap`,
    detail: () => "Structure, fabric and set-up",
    range: (s) => [45000 * s.theme.priceFactor, 80000 * s.theme.priceFactor],
  },
  {
    key: "flowers",
    label: (s) => s.flower.name,
    detail: (s) => `About ${s.mandap.key === "arch" ? 80 : 60} kg`,
    range: (s) => {
      const kg = s.mandap.key === "arch" ? 80 : 60;
      return [kg * s.flower.ratePerKg * 0.9, kg * s.flower.ratePerKg * 1.25];
    },
  },
  {
    key: "drapes",
    label: () => "Drapes",
    detail: (s) => `${s.theme.name}, mandap and backdrop`,
    range: (s) => [15000 * s.theme.priceFactor, 26000 * s.theme.priceFactor],
  },
  {
    key: "lighting",
    label: (s) => s.light.name,
    detail: () => "Including rigging",
    range: () => [18000, 34000],
  },
  {
    key: "aisle",
    label: () => "Aisle petals and runner",
    detail: (s) => s.flower.name,
    range: () => [6000, 9500],
  },
  {
    key: "havan",
    label: () => "Havan kund set-up",
    detail: () => "Brass, ghee, samagri",
    range: () => [4000, 7000],
  },
];

// ─── Defaults for a new project ──────────────────────────────────────────────

export const DEFAULT_SELECTIONS = {
  traditionKey: "north",
  timeKey: "golden",
  venueKey: "palace",
  themeKey: "marigold",
  flowerKey: "marigold",
  mandapKey: "dome",
  lightKey: "fairy",
  brideOutfitKey: "ruby",
  groomOutfitKey: "ivory",
} as const;

// ─── Lookup helpers ──────────────────────────────────────────────────────────

function byKey<T extends { key: string }>(list: T[], key: string, label: string): T {
  const found = list.find((item) => item.key === key);
  if (!found) throw new Error(`Unknown ${label} "${key}". Check src/config/catalog.ts.`);
  return found;
}

export const catalog = {
  venue: (key: string) => byKey(VENUES, key, "venue"),
  theme: (key: string) => byKey(THEMES, key, "theme"),
  flower: (key: string) => byKey(FLOWERS, key, "flower"),
  mandap: (key: string) => byKey(MANDAPS, key, "mandap"),
  light: (key: string) => byKey(LIGHTS, key, "light"),
  brideOutfit: (key: string) => byKey(BRIDE_OUTFITS, key, "bride outfit"),
  groomOutfit: (key: string) => byKey(GROOM_OUTFITS, key, "groom outfit"),
  shot: (key: string) => byKey(SHOT_TEMPLATES, key, "shot"),
  move: (key: string) => byKey(CAMERA_MOVES, key, "camera move"),
  tradition: (key: string) => byKey(TRADITIONS, key, "tradition"),
  time: (key: string) => byKey(CEREMONY_TIMES, key, "ceremony time"),
};

/** The six shot templates for a tradition, in order. */
export function shotsFor(traditionKey: string): ShotTemplate[] {
  return catalog.tradition(traditionKey).shots.map((k) => catalog.shot(k));
}

export const ANCHOR_SHOT_KEY = SHOT_TEMPLATES[0]!.key;

/** Keys that are valid for each selection field, used to validate API input. */
export const SELECTION_KEYS = {
  traditionKey: TRADITIONS.map((v) => v.key),
  timeKey: CEREMONY_TIMES.map((v) => v.key),
  venueKey: VENUES.map((v) => v.key),
  themeKey: THEMES.map((v) => v.key),
  flowerKey: FLOWERS.map((v) => v.key),
  mandapKey: MANDAPS.map((v) => v.key),
  lightKey: LIGHTS.map((v) => v.key),
  brideOutfitKey: BRIDE_OUTFITS.map((v) => v.key),
  groomOutfitKey: GROOM_OUTFITS.map((v) => v.key),
} as const;
