import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <h1 className="font-display text-3xl">We couldn’t find that page</h1>
        <p className="text-sm text-muted">The link may be wrong, or the preview was deleted.</p>
        <Link href="/" className="min-h-[42px] border border-ink px-4 py-2.5 text-sm font-medium">
          Go to the start page
        </Link>
      </div>
    </div>
  );
}
