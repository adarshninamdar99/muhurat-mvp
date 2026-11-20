import clsx from "clsx";

/** A short side note with a coloured rule on the left. */
export function Note({ children, tone = "info", className }: { children: React.ReactNode; tone?: "info" | "warn"; className?: string }) {
  return (
    <p className={clsx("border-l-2 py-0.5 pl-3 text-[13px] text-muted", tone === "warn" ? "border-sindoor" : "border-haldi", className)}>
      {children}
    </p>
  );
}
