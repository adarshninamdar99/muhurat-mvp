"use client";

import { useState } from "react";
import { CAMERA_MOVES, catalog } from "@/config/catalog";
import type { PanelProps } from "../Studio";
import { Button } from "@/components/ui/Button";
import { ChoiceGrid } from "@/components/ui/ChoiceGrid";
import { Note } from "@/components/ui/Note";
import { Spinner } from "@/components/ui/Spinner";
import { PanelHeader } from "./PanelHeader";
import { WeddingFilmButton } from "../film/WeddingFilm";

export function VideoPanel({ project, activeKey, playClip }: PanelProps) {
  const { state } = project;
  const [moveKey, setMoveKey] = useState(CAMERA_MOVES[0]!.key);
  const shot = state.shots.find((s) => s.templateKey === activeKey);
  const shotClips = shot ? state.clips.filter((c) => c.shotId === shot.id) : [];
  const making = shotClips.some((c) => c.status === "queued" || c.status === "running");
  const shotName = catalog.shot(activeKey).name;

  return (
    <>
      <PanelHeader title="Video" help="Turn the selected shot into a 5-second clip with a camera move. Pick a shot in the strip below the picture." />
      <ChoiceGrid label="Camera move" choices={CAMERA_MOVES.map((m) => ({ key: m.key, name: m.name, sub: m.sub }))} value={moveKey} onChange={setMoveKey} />
      {shot?.status === "done" ? (
        <Button variant="solid" disabled={project.pending || making} onClick={() => project.makeClip(shot.id, moveKey)}>
          {making ? <Spinner label="Making the clip…" /> : <>Make a clip of “{shotName}”</>}
        </Button>
      ) : (
        <Note tone="warn">Create “{shotName}” first, then make a clip from it.</Note>
      )}

      {shotClips.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-line pt-3">
          <div className="label-caps">Clips of this shot</div>
          {shotClips.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 border-b border-line py-2 text-sm">
              <span>{catalog.move(c.moveKey).name}</span>
              {c.status === "done" ? (
                <Button variant="quiet" className="min-h-[34px] px-3 py-1" onClick={() => playClip(c)}>
                  Play
                </Button>
              ) : c.status === "failed" ? (
                <span className="text-sindoor">{c.error ?? "Failed"}</span>
              ) : (
                <Spinner label="Making…" />
              )}
            </div>
          ))}
        </div>
      )}
      <dl className="grid text-sm">
        <div className="flex justify-between border-b border-line py-2">
          <dt className="text-muted">Length and quality</dt>
          <dd>{state.capabilities.realVideo ? "5 seconds, 720p" : "5-second preview"}</dd>
        </div>
        <div className="flex justify-between border-b border-line py-2">
          <dt className="text-muted">Typical wait</dt>
          <dd>{state.capabilities.realVideo ? "about a minute" : "instant"}</dd>
        </div>
      </dl>
      <WeddingFilmButton state={state} />
    </>
  );
}
