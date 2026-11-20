"use client";

import { useEffect, useRef, useState } from "react";
import { catalog } from "@/config/catalog";
import { api } from "@/lib/api";
import type { PanelProps } from "../Studio";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Note";
import { useToast } from "@/components/ui/Toast";
import { SaveTheDateCard } from "../share/SaveTheDateCard";
import { PanelHeader } from "./PanelHeader";

/** How often the Share step checks for new family votes. */
const LIVE_MS = 3000;

export function SharePanel({ project, setActiveKey }: PanelProps) {
  const { state } = project;
  const toast = useToast();
  const [share, setShare] = useState<{ url: string; qrSvg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);

  const totalVotes = Object.values(state.votes).reduce((a, b) => a + b, 0);
  const ranked = catalog
    .tradition(state.selections.traditionKey)
    .shots.map((key) => ({ key, name: catalog.shot(key).name, votes: state.votes[key] ?? 0 }))
    .filter((s) => s.votes > 0)
    .sort((a, b) => b.votes - a.votes);

  // Make (or fetch) the family link as soon as the step opens.
  useEffect(() => {
    api
      .shareLink(state.id)
      .then(({ url, qrSvg }) => setShare({ url, qrSvg }))
      .catch((err: Error) => setError(err.message));
  }, [state.id]);

  // Live: check for new votes every few seconds while this step is open.
  const { reload } = project;
  useEffect(() => {
    const timer = setInterval(() => void reload(), LIVE_MS);
    return () => clearInterval(timer);
  }, [reload]);

  // Announce votes that arrive while the step is open.
  useEffect(() => {
    const ids = state.recentVotes.map((v) => v.id);
    if (seen.current) {
      const fresh = state.recentVotes.filter((v) => !seen.current!.has(v.id));
      const first = fresh[0];
      if (first) toast(`♥ ${first.voterName ?? "Someone"} loved “${catalog.shot(first.templateKey).name}”`);
    }
    seen.current = new Set(ids);
  }, [state.recentVotes, toast]);

  const copy = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn’t copy. Select the link and copy it yourself.");
    }
  };

  const whatsappText = share ? `Help us choose! Tap ♥ on the wedding pictures you love: ${share.url}` : "";

  return (
    <>
      <PanelHeader title="Share" help="Ask the family which look they love, and make a save-the-date card from your portrait." />

      <section className="flex flex-col gap-3">
        <div className="label-caps">Ask the family</div>
        <p className="text-sm text-muted">One link for everyone. Family members see the pictures and tap ♥ on their favourites. They can’t change anything.</p>

        {share ? (
          <>
            <div className="flex items-center gap-4">
              <div
                className="h-[132px] w-[132px] flex-none border border-line bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full"
                role="img"
                aria-label="QR code of the family link"
                dangerouslySetInnerHTML={{ __html: share.qrSvg }}
              />
              <p className="text-sm">
                <b className="font-medium">Scan with a phone</b>
                <br />
                <span className="text-muted">Votes appear here as they come in.</span>
              </p>
            </div>
            <input readOnly value={share.url} onFocus={(e) => e.target.select()} aria-label="Family link" className="w-full border border-line bg-paper px-2 py-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copy}>{copied ? "Copied" : "Copy link"}</Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[42px] items-center justify-center rounded-[2px] border border-ink px-4 text-sm font-medium hover:bg-[#F1ECE3]"
              >
                WhatsApp
              </a>
            </div>
          </>
        ) : (
          !error && <p className="text-sm text-muted">Preparing the link…</p>
        )}
        {error && <Note tone="warn">{error}</Note>}

        <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3 text-sm">
          <span className="label-caps">Family favourites</span>
          <span className="text-muted">
            <b className="tabular-nums text-ink">{totalVotes}</b> {totalVotes === 1 ? "vote" : "votes"}
            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-sindoor align-middle" aria-hidden="true" />
            <span className="sr-only">Updating live</span>
          </span>
        </div>
        {ranked.length === 0 ? (
          <p className="text-sm text-muted">No votes yet.</p>
        ) : (
          <ol className="grid gap-1 text-sm">
            {ranked.map((s, i) => (
              <li key={s.key}>
                <button type="button" onClick={() => setActiveKey(s.key)} className="flex w-full justify-between border-b border-line py-1.5 text-left hover:text-sindoor">
                  <span>
                    <span className="mr-2 tabular-nums text-muted">{i + 1}</span>
                    {s.name}
                  </span>
                  <span className="tabular-nums text-sindoor">♥ {s.votes}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {state.recentVotes.length > 0 && (
          <ul className="grid gap-0.5 text-xs text-muted" aria-label="Latest votes">
            {state.recentVotes.slice(0, 4).map((v) => (
              <li key={v.id}>
                <span className="text-ink">{v.voterName ?? "Someone"}</span> loved {catalog.shot(v.templateKey).name} · {ago(v.createdAt)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-line pt-4">
        <SaveTheDateCard state={state} />
      </section>
    </>
  );
}

function ago(t: number): string {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
