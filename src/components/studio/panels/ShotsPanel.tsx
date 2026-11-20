"use client";

import { ANCHOR_SHOT_KEY, catalog, shotsFor } from "@/config/catalog";
import { formatInr } from "@/lib/format";
import type { PanelProps } from "../Studio";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Note";
import { PanelHeader } from "./PanelHeader";
import { StaleNotice } from "./StaleNotice";

export function ShotsPanel({ project, activeKey }: PanelProps) {
  const { state } = project;
  const list = shotsFor(state.selections.traditionKey);
  const done = state.shots.filter((s) => s.status === "done");
  const missing = list.filter((t) => !done.some((s) => s.templateKey === t.key)).map((t) => t.key);
  const active = state.shots.find((s) => s.templateKey === activeKey);
  const working = state.shots.some((s) => s.status === "queued" || s.status === "running");
  const hasFaces = state.photos.some((p) => p.person === "bride") && state.photos.some((p) => p.person === "groom");
  const price = (n: number) => (state.prices.imageInr > 0 ? ` · about ${formatInr(Math.ceil(n * state.prices.imageInr))}` : "");

  return (
    <>
      <PanelHeader
        title="Shots"
        help={`Six moments from a ${catalog.tradition(state.selections.traditionKey).name} wedding, drawn with the same couple, outfits and décor.`}
      />
      <dl className="grid text-sm">
        <Row label="Drawn" value={`${done.length} of ${list.length}`} />
        <Row label="Cost per picture" value={costLabel(state)} />
        {state.allowance && (
          <Row
            label="Free pictures left today"
            value={`about ${Math.max(0, state.allowance.approxDailyLimit - state.allowance.picturesToday)}`}
          />
        )}
      </dl>

      {!hasFaces && <Note tone="warn">Add at least one photo of the bride and one of the groom first, so the pictures show their real faces.</Note>}

      {missing.length > 0 ? (
        <Button variant="solid" disabled={project.pending || working} onClick={() => project.drawShots(missing)}>
          {missing.length === list.length ? `Draw all ${list.length} shots` : `Draw the other ${missing.length}`}
          <span className="font-normal opacity-80">{price(missing.length)}</span>
        </Button>
      ) : (
        <Button variant="solid" disabled={project.pending || working} onClick={() => project.drawShots(list.map((t) => t.key))}>
          Redraw all {list.length}<span className="font-normal opacity-80">{price(list.length)}</span>
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

function costLabel(state: PanelProps["project"]["state"]): string {
  if (state.provider === "cloudflare") return "free (daily allowance)";
  if (state.provider === "mock") return "free in demo mode";
  return `about ${formatInr(state.prices.imageInr, 2)}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}
