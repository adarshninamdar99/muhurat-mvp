"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Drag-to-compare: the couple's empty venue photo on the left, the drawn
 * wedding picture on the right. Works with mouse, touch and arrow keys
 * (it is a native range input underneath).
 */
export function BeforeAfter({ before, after, afterLabel }: { before: string; after: string; afterLabel: string }) {
  const [split, setSplit] = useState(50);
  return (
    <div className="absolute inset-0 select-none">
      <Image src={after} alt={afterLabel} fill unoptimized sizes="1000px" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <Image src={before} alt="Your venue as it is today" fill unoptimized sizes="1000px" className="object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-paper shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${split}%` }}>
        <span className="absolute top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-xs text-ink shadow-sm">
          ⟷
        </span>
      </div>
      <span className="pointer-events-none absolute left-3 top-3 bg-surface/90 px-2 py-1 text-xs">Your venue today</span>
      <span className="pointer-events-none absolute right-3 top-3 bg-surface/90 px-2 py-1 text-xs">On the day</span>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label="Drag to compare your venue today with the wedding picture"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
