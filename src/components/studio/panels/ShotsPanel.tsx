"use client";

import { ANCHOR_SHOT_KEY, catalog, SHOT_TEMPLATES } from "@/config/catalog";
import { formatInr } from "@/lib/format";
import type { PanelProps } from "../Studio";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Note";
import { PanelHeader } from "./PanelHeader";
import { StaleNotice } from "./StaleNotice";

export function ShotsPanel({ project, activeKey }: PanelProps) {
  const { state } = project;
  const done = state.shots.filter((s) => s.status === "done");
  const missing = SHOT_TEMPLATES.filter((t) => !done.some((s) => s.templateKey === t.key)).map((t) => t.key);
  const active = state.shots.find((s) => s.templateKey === activeKey);
  const working = state.shots.some((s) => s.status === "queued" || s.status === "running");
  const hasFaces = state.photos.some((p) => p.person === "bride") && state.photos.some((p) => p.person === "groom");
  const price = (n: number) => (state.prices.imageInr > 0 ? ` · about ${formatInr(Math.ceil(n * state.prices.imageInr))}` : "");

  return (
    <>
      <PanelHeader title="Shots" help="Six moments from the day, drawn with the same couple, outfits and décor." />
      <dl className="grid text-sm">
        <Row label="Drawn" value={`${done.length} of ${SHOT_TEMPLATES.length}`} />
        <Row label="Cost per picture" value={state.prices.imageInr > 0 ? `about ${formatInr(state.prices.imageInr, 2)}` : "free in demo mode"} />
      </dl>

      {!hasFaces && <Note tone="warn">Add at least one photo of the bride and one of the groom first, so the pictures show their real faces.</Note>}

      {missing.length > 0 ? (
        <Button variant="solid" disabled={project.pending || working} onClick={() => project.drawShots(missing)}>
          {missing.length === SHOT_TEMPLATES.length ? "Draw all 6 shots" : `Draw the other ${missing.length}`}
          <span className="font-normal opacity-80">{price(missing.length)}</span>
        </Button>
      ) : (
        <Button variant="solid" disabled={project.pending || working} onClick={() => project.drawShots(SHOT_TEMPLATES.map((t) => t.key))}>
          Redraw all 6<span className="font-normal opacity-80">{price(6)}</span>
        </Button>
      )}
      <Button disabled={project.pending || active?.status === "queued" || active?.status === "running"} onClick={() => project.drawShots([activeKey])}>
        {active?.status === "done" ? "Redraw" : "Draw"} “{catalog.shot(activeKey).name}”
      </Button>
      <StaleNotice project={project} />

      <details className="border-t border-line pt-2.5 text-sm">
        <summary className="min-h-8 cursor-pointer font-medium">How a shot is made</summary>
        <ol className="mt-2 grid list-decimal gap-1 pl-5 text-muted">
          <li>Up to 2 photos of each person, the venue photo and any outfit photos are sent as references.</li>
          <li>“{catalog.shot(ANCHOR_SHOT_KEY).name}” is drawn first. Every other shot also gets it as a reference, so décor and outfits match.</li>
          <li>The AI receives a written description of the moment, venue, décor and outfits.</li>
          <li>The finished picture is saved, and its cost is recorded.</li>
        </ol>
      </details>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}
