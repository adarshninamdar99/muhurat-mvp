import { catalog, VENDOR_LINES } from "@/config/catalog";
import { roundTo500 } from "@/lib/format";
import type { Quote, Selections } from "@/lib/types";

/**
 * Builds the priced décor list for a set of choices.
 * Ranges come from VENDOR_LINES in src/config/catalog.ts.
 */
export function buildQuote(sel: Selections): Quote {
  const labels = {
    theme: catalog.theme(sel.themeKey),
    flower: catalog.flower(sel.flowerKey),
    mandap: catalog.mandap(sel.mandapKey),
    light: catalog.light(sel.lightKey),
  };
  const lines = VENDOR_LINES.map((line) => {
    const [low, high] = line.range(labels);
    return { key: line.key, label: line.label(labels), detail: line.detail(labels), low: roundTo500(low), high: roundTo500(high) };
  });
  return {
    lines,
    totalLow: lines.reduce((sum, l) => sum + l.low, 0),
    totalHigh: lines.reduce((sum, l) => sum + l.high, 0),
  };
}
