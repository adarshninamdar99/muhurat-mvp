"use client";

import clsx from "clsx";

export interface Choice {
  key: string;
  name: string;
  sub?: string;
  swatches?: string[];
}

/** A grid of radio-style options. Used for venues, décor, outfits and camera moves. */
export function ChoiceGrid({
  label,
  choices,
  value,
  onChange,
  columns = 2,
  disabled,
}: {
  label?: string;
  choices: Choice[];
  value: string;
  onChange: (key: string) => void;
  columns?: 1 | 2;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
      {label && <div className="label-caps">{label}</div>}
      <div className={clsx("grid gap-1.5", columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {choices.map((c) => {
          const on = c.key === value;
          return (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => !on && onChange(c.key)}
              className={clsx(
                "flex min-h-[44px] items-start gap-2.5 border p-2.5 text-left transition-colors disabled:opacity-50",
                on ? "border-ink" : "border-line hover:border-[#bdb3a3]",
              )}
            >
              <span
                aria-hidden="true"
                className={clsx("relative mt-[3px] h-3.5 w-3.5 flex-none rounded-full border-[1.5px]", on ? "border-sindoor" : "border-[#9d9488]")}
              >
                {on && <span className="absolute inset-[2px] rounded-full bg-sindoor" />}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{c.name}</span>
                {c.sub && <span className="text-xs leading-snug text-muted">{c.sub}</span>}
                {c.swatches && (
                  <span className="mt-1.5 flex gap-0.5" aria-hidden="true">
                    {c.swatches.map((s) => (
                      <span key={s} className="block h-2.5 w-4 border border-black/10" style={{ background: s }} />
                    ))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
