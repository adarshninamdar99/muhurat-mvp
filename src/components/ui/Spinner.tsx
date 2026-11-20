export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-sindoor motion-reduce:animate-none" aria-hidden="true" />
      {label ? <span>{label}</span> : <span className="sr-only">Working…</span>}
    </span>
  );
}
