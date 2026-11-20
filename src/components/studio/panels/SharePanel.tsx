"use client";

import { useState } from "react";
import { catalog } from "@/config/catalog";
import { api } from "@/lib/api";
import type { PanelProps } from "../Studio";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Note";
import { SaveTheDateCard } from "../share/SaveTheDateCard";
import { PanelHeader } from "./PanelHeader";

export function SharePanel({ project, setActiveKey }: PanelProps) {
  const { state } = project;
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalVotes = Object.values(state.votes).reduce((a, b) => a + b, 0);
  const ranked = catalog
    .tradition(state.selections.traditionKey)
    .shots.map((key) => ({ key, name: catalog.shot(key).name, votes: state.votes[key] ?? 0 }))
    .filter((s) => s.votes > 0)
    .sort((a, b) => b.votes - a.votes);

  const makeLink = async () => {
    setError(null);
    try {
      const { path } = await api.shareLink(state.id);
      setLink(`${window.location.origin}${path}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn’t copy. Select the link and copy it yourself.");
    }
  };

  const whatsappText = link ? `Help us choose! Tap ♥ on the wedding pictures you love: ${link}` : "";

  return (
    <>
      <PanelHeader title="Share" help="Ask the family which look they love, and make a save-the-date card from your portrait." />

      <section className="flex flex-col gap-2">
        <div className="label-caps">Ask the family</div>
        <p className="text-sm text-muted">Send one link. Family members see your pictures and tap ♥ on their favourites. They can’t change anything.</p>
        {!link ? (
          <Button variant="solid" onClick={makeLink}>
            Make family link
          </Button>
        ) : (
          <>
            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Family link" className="w-full border border-line bg-paper px-2 py-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copy}>{copied ? "Copied" : "Copy link"}</Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[42px] items-center justify-center rounded-[2px] border border-ink px-4 text-sm font-medium hover:bg-[#F1ECE3]"
              >
                Send on WhatsApp
              </a>
            </div>
          </>
        )}
        {error && <Note tone="warn">{error}</Note>}

        <div className="mt-1 flex items-center justify-between text-sm">
          <span>
            <b className="tabular-nums">{totalVotes}</b> {totalVotes === 1 ? "vote" : "votes"} so far
          </span>
          <Button variant="quiet" className="min-h-[34px] px-3 py-1" disabled={project.pending} onClick={project.refresh}>
            Refresh
          </Button>
        </div>
        {ranked.length > 0 && (
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
      </section>

      <section className="border-t border-line pt-4">
        <SaveTheDateCard state={state} />
      </section>
    </>
  );
}
