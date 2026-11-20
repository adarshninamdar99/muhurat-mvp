"use client";

import clsx from "clsx";
import Image from "next/image";
import { shotsFor } from "@/config/catalog";
import { pad2 } from "@/lib/format";
import type { ShotDTO } from "@/lib/types";

/** The row of six shot thumbnails under the main picture. */
export function Filmstrip({
  shots,
  traditionKey,
  votes,
  active,
  onSelect,
}: {
  shots: ShotDTO[];
  traditionKey: string;
  votes: Record<string, number>;
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1" aria-label="All shots">
      {shotsFor(traditionKey).map((t, i) => {
        const shot = shots.find((s) => s.templateKey === t.key);
        const on = t.key === active;
        const working = shot?.status === "queued" || shot?.status === "running";
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            aria-pressed={on}
            className="relative w-[150px] flex-none text-left"
          >
            <div className={clsx("relative aspect-video overflow-hidden border bg-surface", on ? "border-2 border-ink" : "border-line")}>
              {shot?.url ? (
                <Image src={shot.url} alt="" fill sizes="150px" unoptimized className={clsx("object-cover", working && "opacity-40")} />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,#fff,#fff_7px,#f4efe6_7px,#f4efe6_8px)] text-xs text-muted">
                  {shot?.status === "running" ? "Creating…" : shot?.status === "queued" ? "Next in line" : shot?.status === "failed" ? "Try again" : "Not created"}
                </div>
              )}
              {shot?.stale && !working && (
                <span className="absolute left-1 top-1 bg-haldi px-1.5 py-0.5 text-[11px] font-medium text-white">Out of date</span>
              )}
              {(votes[t.key] ?? 0) > 0 && (
                <span className="absolute bottom-1 right-1 bg-surface/95 px-1.5 py-0.5 text-[11px] font-medium text-sindoor" title="Family votes">
                  ♥ {votes[t.key]}
                </span>
              )}
            </div>
            <div className={clsx("flex gap-1.5 pt-1.5 text-[13px]", on && "font-semibold")}>
              <span className="tabular-nums text-muted">{pad2(i + 1)}</span>
              {t.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
