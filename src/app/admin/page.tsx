import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";
import { adminOverview } from "@/server/services/usage";
import { formatInr } from "@/lib/format";
import { cloudflareAllowance } from "@/server/services/projects";

const PROVIDER_LABEL = { mock: "demo sketches", cloudflare: "Cloudflare Workers AI (free)", fal: "fal.ai (paid)" } as const;

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/** Usage, cost and failures across all previews. Protected by src/middleware.ts. */
export default function AdminPage() {
  const db = getDb();
  const { totals, projectCount, perProject, failedJobs } = adminOverview(db);
  const allowance = env.AI_PROVIDER === "cloudflare" ? cloudflareAllowance(db) : null;
  const tiles = [
    { label: "Previews", value: String(projectCount) },
    { label: "Pictures made", value: String(totals?.images ?? 0) },
    { label: "Clips made", value: String(totals?.clips ?? 0) },
    { label: "AI spend", value: formatInr(totals?.inr ?? 0, 2) },
    { label: "Avg time per picture", value: totals?.avgMs ? `${(totals.avgMs / 1000).toFixed(1)} s` : "–" },
  ];
  return (
    <div className="mx-auto max-w-6xl px-7 py-8 max-md:px-4">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Link href="/" className="font-display text-2xl italic">
            Muhurat
          </Link>
          <h1 className="font-display text-4xl font-medium">Admin</h1>
        </div>
        <span className="text-right text-sm text-muted">
          AI provider: {PROVIDER_LABEL[env.AI_PROVIDER]}
          {allowance && (
            <>
              <br />
              Free pictures today: about {allowance.picturesToday} of {allowance.approxDailyLimit} (resets 5:30 am IST)
            </>
          )}
        </span>
      </header>

      <section className="mb-10 grid grid-cols-5 gap-px border border-line bg-line max-md:grid-cols-2" aria-label="Totals">
        {tiles.map((t) => (
          <div key={t.label} className="bg-surface p-4">
            <div className="label-caps">{t.label}</div>
            <div className="mt-1 text-2xl tabular-nums">{t.value}</div>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-2xl">Previews</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="py-2 font-semibold">Couple</th>
                <th className="py-2 font-semibold">Started</th>
                <th className="py-2 text-right font-semibold">AI calls</th>
                <th className="py-2 text-right font-semibold">Spend</th>
              </tr>
            </thead>
            <tbody>
              {perProject.map((p) => (
                <tr key={p.id} className="border-b border-line">
                  <td className="py-2">
                    <Link href={`/p/${p.id}/shots`} className="underline decoration-line underline-offset-4 hover:text-sindoor">
                      {p.brideName} &amp; {p.groomName}
                    </Link>
                  </td>
                  <td className="py-2 text-muted">{new Date(p.createdAt).toLocaleString("en-IN")}</td>
                  <td className="py-2 text-right tabular-nums">{p.calls}</td>
                  <td className="py-2 text-right tabular-nums">{formatInr(p.inr, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Failed jobs</h2>
        {failedJobs.length === 0 ? (
          <p className="text-sm text-muted">No failed jobs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink text-left">
                  <th className="py-2 font-semibold">When</th>
                  <th className="py-2 font-semibold">Type</th>
                  <th className="py-2 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {failedJobs.map((j) => (
                  <tr key={j.id} className="border-b border-line align-top">
                    <td className="py-2 text-muted">{new Date(j.createdAt).toLocaleString("en-IN")}</td>
                    <td className="py-2">{j.type}</td>
                    <td className="py-2 font-mono text-xs">{j.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
