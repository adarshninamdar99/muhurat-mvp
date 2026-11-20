"use client";

import { ANCHOR_SHOT_KEY, catalog, shotsFor } from "@/config/catalog";
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

  return (
    <>
      <PanelHeader
        title="Shots"
        help={`Six moments from a ${catalog.tradition(state.selections.traditionKey).name} wedding, with the same couple, outfits and décor in every one.`}
      />
      <dl className="grid text-sm">
        <Row label="Ready" value={`${done.length} of ${list.length}`} />
        <Row label="Each picture takes" value="about 10–20 seconds" />
      </dl>

      {!hasFaces && <Note tone="warn">Add a photo of the bride and one of the groom first, so the shots show their real faces.</Note>}

      {missing.length > 0 ? (
        <Button variant="solid" disabled={project.pending || working} onClick={() => project.drawShots(missing)}>
          {missing.length === list.length ? `Create all ${list.length} shots` : `Create the other ${missing.length}`}
        </Button>
      ) : (
        <Button variant="solid" disabled={project.pending || working} onClick={() => project.drawShots(list.map((t) => t.key))}>
          Recreate all {list.length}
        </Button>
      )}
      <Button disabled={project.pending || active?.status === "queued" || active?.status === "running"} onClick={() => project.drawShots([activeKey])}>
        {active?.status === "done" ? "Recreate" : "Create"} “{catalog.shot(activeKey).name}”
      </Button>
      <StaleNotice project={project} />

      <details className="border-t border-line pt-2.5 text-sm">
        <summary className="min-h-8 cursor-pointer font-medium">How every shot stays consistent</summary>
        <ol className="mt-2 grid list-decimal gap-1 pl-5 text-muted">
          <li>The couple’s own photos keep their faces true in every shot.</li>
          <li>“{catalog.shot(ANCHOR_SHOT_KEY).name}” is made first and sets the look. Every other shot follows it, so décor, flowers and outfits match.</li>
          <li>The venue photo keeps the real architecture; only the décor is added.</li>
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
