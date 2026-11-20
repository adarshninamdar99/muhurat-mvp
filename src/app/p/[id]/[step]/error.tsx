"use client";

export default function StudioError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <h1 className="font-display text-3xl">This preview didn’t load</h1>
        <p className="text-sm text-muted">It may be a connection problem. Your photos and choices are saved.</p>
        <button type="button" onClick={reset} className="min-h-[42px] border border-ink px-4 text-sm font-medium">
          Try again
        </button>
      </div>
    </div>
  );
}
