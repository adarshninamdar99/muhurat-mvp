import type { SceneContext } from "../../types";

/**
 * Draws a storyboard sketch of one shot as an SVG string (1600×900).
 * Used only in demo mode, so the whole app can be tried without an AI account.
 * Colours come from the catalog; faces are the couple's uploaded photos.
 *
 * Coordinates are in a fixed 1600×900 "world". Each shot template's camera
 * (zoom + centre) decides which part of the world is visible.
 */

export interface StoryboardImages {
  bride?: string; // data URI of the bride's face
  groom?: string; // data URI of the groom's face
  venue?: string; // data URI of the uploaded venue photo, used as the backdrop
}

const INK = "#2A251F";
const SKIN = "#d39a72";

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function face(id: string, cx: number, cy: number, r: number, photo?: string): string {
  if (photo) {
    return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <image href="${photo}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="ln"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SKIN}" class="ln"/>
    <path d="M${cx - r} ${cy - 2} q0 -${r + 4} ${r} -${r + 4} q${r} 0 ${r} ${r + 4} q-${r * 0.5} -${r * 0.6} -${r} -${r * 0.6} q-${r * 0.5} 0 -${r} ${r * 0.6} Z" fill="#3a2a22" class="ln"/>`;
}

function bride(s: SceneContext, x: number, y: number, k: number, photo?: string): string {
  const o = s.brideOutfit;
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <path d="M-18 -140 L18 -140 Q30 -70 72 0 Q0 12 -72 0 Q-30 -70 -18 -140 Z" fill="${o.main}" class="ln"/>
    <path d="M-72 0 Q0 12 72 0" stroke="${o.trim}" stroke-width="6" fill="none"/>
    <rect x="-20" y="-190" width="40" height="54" rx="10" fill="${o.main}" class="ln"/>
    <path d="M-20 -185 q-14 30 -10 70 M20 -185 q14 30 10 70" stroke="${SKIN}" stroke-width="8" fill="none"/>
    ${face("fb", 0, -212, 20, photo)}
    <path d="M-26 -226 Q0 -246 26 -226 Q42 -150 58 -40 Q20 -120 -6 -150 Q-28 -180 -26 -226 Z" fill="${o.veil}" fill-opacity=".45" class="ln"/>
  </g>`;
}

function groom(s: SceneContext, x: number, y: number, k: number, photo?: string): string {
  const o = s.groomOutfit;
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <rect x="-20" y="-72" width="15" height="72" fill="#f3eee2" class="ln"/><rect x="5" y="-72" width="15" height="72" fill="#f3eee2" class="ln"/>
    <path d="M-28 -200 L28 -200 L34 -68 L-34 -68 Z" fill="${o.coat}" class="ln"/>
    <path d="M-28 -198 q-12 40 -8 96 M28 -198 q12 40 8 96" stroke="${o.coat}" stroke-width="13" fill="none"/>
    <path d="M-26 -196 L28 -110" stroke="${o.trim}" stroke-width="6"/>
    ${face("fg", 0, -222, 20, photo)}
    <path d="M-23 -230 Q-24 -262 0 -262 Q24 -262 23 -230 Q0 -240 -23 -230 Z" fill="${o.safa}" class="ln"/>
  </g>`;
}

function garland(s: SceneContext, x1: number, y1: number, x2: number, y2: number, sag: number, n: number): string {
  const [a, b] = s.flower.colors;
  let out = "";
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${i % 2 ? a : b}" class="thin"/>`;
  }
  return out;
}

function farLayer(s: SceneContext): string {
  switch (s.venue.key) {
    case "palace": {
      let out = `<rect x="-400" y="250" width="2400" height="320" fill="#d7a57b" class="ln"/>`;
      for (let i = 0; i < 9; i++) {
        const x = -260 + i * 250;
        out += `<path d="M${x} 565 V380 a75 75 0 0 1 150 0 V565 Z" fill="#8a5240" class="ln"/>`;
      }
      return out;
    }
    case "beach":
      return `<circle cx="1180" cy="470" r="70" fill="#f6c27a"/><rect x="-400" y="470" width="2400" height="100" fill="#6aa3bc" class="ln"/>`;
    case "banquet": {
      let out = `<rect x="-400" y="120" width="2400" height="450" fill="#e3d2c4" class="ln"/>`;
      for (let i = 0; i < 10; i++) out += `<rect x="${-300 + i * 220}" y="200" width="160" height="330" fill="none" class="ln"/>`;
      return out;
    }
    case "garden": {
      let out = "";
      for (let i = 0; i < 14; i++) {
        out += `<circle cx="${-300 + i * 160}" cy="${470 - (i % 2) * 30}" r="${70 + (i % 3) * 25}" fill="${i % 2 ? "#6f9a63" : "#86ad78"}" class="ln"/>`;
      }
      return out + `<rect x="-400" y="470" width="2400" height="100" fill="#6f9a63" class="ln"/>`;
    }
    default: {
      let out = `<rect x="-400" y="330" width="2400" height="240" fill="#a8835b" class="ln"/>`;
      for (let i = 0; i < 12; i++) out += `<rect x="${-300 + i * 190}" y="300" width="56" height="270" fill="#cfae84" class="ln"/>`;
      return out;
    }
  }
}

function mandap(s: SceneContext): string {
  const T = s.theme;
  const [fa, fb] = s.flower.colors;
  const ex = s.template.extras ?? {};
  let out = `<polygon points="470,640 1130,640 1180,690 420,690" fill="${T.key === "ivory" ? "#f2ece0" : "#ece0c8"}" class="ln"/>
    <rect x="420" y="690" width="760" height="18" fill="#c7aa7a" class="ln"/>`;
  for (const x of [620, 980]) out += `<rect x="${x - 9}" y="390" width="18" height="250" fill="${T.pillar}" class="ln"/>`;
  out += `<path d="M600 400 Q800 470 1000 400 L1000 640 L600 640 Z" fill="${T.drape}" class="ln"/>
    <path d="M600 400 Q700 520 690 640 L600 640 Z M1000 400 Q900 520 910 640 L1000 640 Z" fill="${shade(T.drape, -25)}" class="ln"/>`;
  for (const x of [540, 1060]) {
    out += `<rect x="${x - 14}" y="340" width="28" height="350" fill="${T.pillar}" class="ln"/>`;
    for (let i = 0; i < 9; i++) out += `<circle cx="${x + (i % 2 ? 10 : -10)}" cy="${360 + i * 36}" r="9" fill="${i % 2 ? fa : fb}" class="thin"/>`;
  }
  if (s.mandap.key === "dome") {
    out += `<path d="M510 345 Q800 150 1090 345 Z" fill="${T.canopy}" class="ln"/>` + garland(s, 520, 345, 1080, 345, 40, 30);
  } else if (s.mandap.key === "arch") {
    for (let i = 0; i <= 40; i++) {
      const a = (Math.PI * i) / 40;
      out += `<circle cx="${(800 - Math.cos(a) * 270).toFixed(1)}" cy="${(345 - Math.sin(a) * 170).toFixed(1)}" r="${i % 3 ? 13 : 16}" fill="${i % 2 ? fa : fb}" class="thin"/>`;
    }
  } else {
    out += `<rect x="510" y="330" width="580" height="22" fill="${T.canopy}" class="ln"/>` + garland(s, 520, 352, 1080, 352, 26, 26);
  }
  if (s.light.key === "fairy") {
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const x = -100 + t * 1800;
        const y = 120 + k * 70 + Math.sin(t * Math.PI * 3) * 30;
        out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5" fill="#f6d36b" class="thin"/>`;
      }
    }
  } else if (s.light.key === "chandelier") {
    for (let r = 0; r < 3; r++) {
      const n = 8 + r * 4;
      const R = 30 + r * 28;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI;
        out += `<circle cx="${(800 + Math.cos(a) * R * 1.6).toFixed(1)}" cy="${(120 + Math.sin(a) * R * 0.5 + r * 26).toFixed(1)}" r="${5 - r}" fill="#fbf3d8" class="thin"/>`;
      }
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const t = Math.floor(i / 2) / 6;
      const y = 640 + t * 300;
      const x = 800 + side * (120 + t * 300);
      out += `<ellipse cx="${x}" cy="${y}" rx="${8 + t * 10}" ry="${4 + t * 5}" fill="#b8860b" class="thin"/><path d="M${x} ${y - 4} q-4 -10 0 -${16 + t * 10} q4 10 0 ${16 + t * 10}" fill="#f2a73a"/>`;
    }
  }
  if (ex.sofa) out += `<path d="M650 640 v-70 q0 -30 30 -30 h240 q30 0 30 30 v70 Z" fill="${shade(T.drape, -10)}" class="ln"/>`;
  if (ex.fire) {
    out += `<rect x="770" y="668" width="60" height="26" fill="#8a5a2b" class="ln"/><path d="M800 668 q-22 -30 -6 -60 q4 22 14 26 q4 -26 18 -44 q6 40 -6 78 Z" fill="#f0882a" class="ln"/>`;
  }
  return out;
}

function guests(kind: "aisle" | "family" | undefined, where: "back" | "front"): string {
  const cols = ["#8a6a80", "#6a8494", "#a08055", "#77709a", "#94606c", "#5f8a78"];
  const fig = (x: number, y: number, k: number, c: string) =>
    `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-30 0 Q-34 -110 0 -120 Q34 -110 30 0 Z" fill="${c}" class="ln"/><circle cx="0" cy="-140" r="20" fill="#c99a77" class="ln"/></g>`;
  if (kind === "aisle" && where === "front") {
    const spots: [number, number, number][] = [[180, 920, 1.6], [380, 880, 1.35], [1220, 880, 1.35], [1420, 920, 1.6], [90, 1000, 1.9], [1510, 1000, 1.9]];
    return spots.map((g, i) => fig(g[0], g[1], g[2], cols[i]!)).join("");
  }
  if (kind === "family" && where === "back") return [600, 680, 920, 1000].map((x, i) => fig(x, 690, 0.95, cols[i]!)).join("");
  if (kind === "family" && where === "front") return [500, 1100].map((x, i) => fig(x, 720, 1.05, cols[i + 3]!)).join("");
  return "";
}

export function renderStoryboardSvg(s: SceneContext, faces: StoryboardImages): string {
  const t = s.template;
  const { zoom, cx, cy } = t.camera;
  const c = t.couple;
  const [fa, fb] = s.flower.colors;

  let petals = "";
  for (let i = 0; i < 60; i++) {
    const p = i / 60;
    const y = 610 + p * 560;
    const half = 60 + p * 260;
    const x = 800 + (((i * 97) % 200) - 100) / 100 * half;
    petals += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + p * 5).toFixed(1)}" fill="${i % 2 ? fa : fb}"/>`;
  }

  let garlands = "";
  if (t.extras?.garland) {
    for (const [gx, gy] of [[c.x - c.gap / 2, c.y - 192], [c.x + c.gap / 2, c.y - 200]] as const) {
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * 0.15 + (i / 13) * Math.PI * 0.7;
        garlands += `<circle cx="${(gx + Math.cos(a) * 22).toFixed(1)}" cy="${(gy + Math.sin(a) * 34).toFixed(1)}" r="5" fill="${i % 2 ? fa : fb}" class="thin"/>`;
      }
    }
  }

  const aisleColor = s.theme.key === "ivory" ? "#efe7d6" : s.theme.drape;
  const camera = `translate(800 450) scale(${zoom}) translate(${-cx} ${-cy})`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <style>.ln{stroke:${INK};stroke-width:1.6;stroke-linejoin:round}.thin{stroke:${INK};stroke-width:.9}</style>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.time.sky[0]}"/><stop offset=".6" stop-color="${s.time.sky[1]}"/><stop offset="1" stop-color="${s.time.sky[2]}"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.venue.floor[0]}"/><stop offset="1" stop-color="${s.venue.floor[1]}"/></linearGradient>
    <filter id="pencil" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>
  </defs>
  <rect width="1600" height="900" fill="#f6f2ea"/>
  <g filter="url(#pencil)"><g transform="${camera}">
    ${
      faces.venue
        ? `<image href="${faces.venue}" x="-400" y="-300" width="2400" height="900" preserveAspectRatio="xMidYMax slice" opacity=".9"/>`
        : `<rect x="-400" y="-300" width="2400" height="900" fill="url(#sky)"/>${farLayer(s)}`
    }
    <polygon points="-400,560 2000,560 2000,1200 -400,1200" fill="url(#floor)"/>
    <polygon points="740,600 860,600 1060,1200 540,1200" fill="${aisleColor}" fill-opacity=".5" class="ln"/>
    ${petals}
    ${mandap(s)}
    ${guests(t.extras?.guests, "back")}
    ${bride(s, c.x - c.gap / 2, c.y, c.scale, faces.bride)}
    ${groom(s, c.x + c.gap / 2, c.y, c.scale, faces.groom)}
    ${garlands}
    ${guests(t.extras?.guests, "front")}
  </g></g>
  ${s.time.key === "night" ? `<rect width="1600" height="900" fill="#0d1030" fill-opacity=".28"/>` : ""}
  <rect x="0" y="852" width="1600" height="48" fill="#FBF9F5" fill-opacity=".85"/>
  <text x="28" y="884" font-family="Georgia, serif" font-size="22" fill="${INK}">Demo sketch · ${escapeXml(t.name)} · ${escapeXml(s.brideName)} &amp; ${escapeXml(s.groomName)}</text>
  <text x="1572" y="884" font-family="Arial, sans-serif" font-size="18" fill="#6B655C" text-anchor="end">Switch on the free AI setting for real pictures</text>
</svg>`;
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch]!);
}
