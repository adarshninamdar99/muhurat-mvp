import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTIONS } from "@/config/catalog";
import { buildQuote } from "@/server/services/quote";

describe("buildQuote", () => {
  it("adds up the lines and rounds to the nearest ₹500", () => {
    const q = buildQuote({ ...DEFAULT_SELECTIONS });
    expect(q.lines).toHaveLength(6);
    for (const l of q.lines) {
      expect(l.low % 500).toBe(0);
      expect(l.high % 500).toBe(0);
      expect(l.high).toBeGreaterThan(l.low);
    }
    expect(q.totalLow).toBe(q.lines.reduce((s, l) => s + l.low, 0));
    expect(q.totalHigh).toBe(q.lines.reduce((s, l) => s + l.high, 0));
  });

  it("uses more flowers for a flower arch", () => {
    const dome = buildQuote({ ...DEFAULT_SELECTIONS, mandapKey: "dome" }).lines.find((l) => l.key === "flowers")!;
    const arch = buildQuote({ ...DEFAULT_SELECTIONS, mandapKey: "arch" }).lines.find((l) => l.key === "flowers")!;
    expect(arch.low).toBeGreaterThan(dome.low);
    expect(arch.detail).toContain("80 kg");
  });
});
