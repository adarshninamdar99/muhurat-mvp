import Link from "next/link";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";
import { listProjects } from "@/server/services/projects";
import { NewPreviewForm } from "@/components/home/NewPreviewForm";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const projects = listProjects(getDb(), 12);
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line px-7 py-4 max-md:px-4">
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[28px] font-medium italic">Muhurat</span>
          <span className="text-xs text-muted">for A Lovers Card</span>
        </div>
        {env.AI_PROVIDER === "mock" && <span className="border border-line px-2.5 py-1 text-xs text-muted">Demo mode</span>}
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-[1.1fr_1fr] gap-12 px-7 py-14 max-md:grid-cols-1 max-md:gap-8 max-md:px-4 max-md:py-8">
        <section className="flex flex-col gap-5">
          <h1 className="font-display text-5xl font-medium leading-[1.08] max-md:text-4xl">See the wedding before you book it</h1>
          <p className="max-w-prose text-lg text-muted">
            Add a few photos of the couple and their venue, choose décor and outfits, and get six matching pictures of their wedding, plus short
            clips. The look they like becomes a priced décor list for vendors.
          </p>
          <ol className="grid gap-2 text-sm text-muted">
            <li>
              <b className="text-ink">1.</b> Add photos of the couple
            </li>
            <li>
              <b className="text-ink">2.</b> Pick the venue, décor and outfits
            </li>
            <li>
              <b className="text-ink">3.</b> Draw the shots, make a clip, ask vendors for quotes
            </li>
          </ol>
        </section>
        <NewPreviewForm />
      </main>

      {projects.length > 0 && (
        <section className="mx-auto max-w-5xl px-7 pb-16 max-md:px-4" aria-labelledby="recent">
          <h2 id="recent" className="label-caps mb-3">
            Recent previews
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/p/${p.id}/shots`} className="flex items-center justify-between gap-4 py-3 hover:text-sindoor">
                  <span className="font-medium">
                    {p.brideName} &amp; {p.groomName}
                  </span>
                  <span className="text-sm text-muted">{new Date(p.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
