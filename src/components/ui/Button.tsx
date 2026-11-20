import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "solid" | "outline" | "quiet";

const styles: Record<Variant, string> = {
  solid: "bg-ink text-paper border-ink hover:bg-[#3a362f]",
  outline: "bg-transparent text-ink border-ink hover:bg-[#F1ECE3]",
  quiet: "bg-transparent text-ink border-line hover:border-[#bdb3a3]",
};

/** The one button used across the app. */
export function Button({ variant = "outline", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[2px] border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        styles[variant],
        className,
      )}
    />
  );
}
