"use client";

import clsx from "clsx";
import Image from "next/image";
import { catalog, shotsFor } from "@/config/catalog";
import { pad2 } from "@/lib/format";
import type { ClipDTO, ProjectState } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { BeforeAfter } from "./BeforeAfter";

export type StageView = "picture" | "compare" | "venue" | "depth";

/**
 * The large picture in the middle of the studio.
 * Shows the selected shot, the venue photo or its depth map, or a playing clip.
 */
export function ShotStage({
  state,
  activeKey,
  view,
  onViewChange,
  clip,
  onRetry,
}: {
  state: ProjectState;
  activeKey: string;
  view: StageView;
  onViewChange: (v: StageView) => void;
  clip: ClipDTO | null;
  onRetry: () => void;
}) {
  const template = catalog.shot(activeKey);
  const list = shotsFor(state.selections.traditionKey);
  const index = list.findIndex((t) => t.key === activeKey) + 1;
  const shot = state.shots.find((s) => s.templateKey === activeKey);
  const working = shot?.status === "queued" || shot?.status === "running";
  const job = state.activeJobs.find((j) => j.type === "generate_shot" && j.status === "running");
  const venueName = state.venuePhotoUrl ? "Your venue" : catalog.venue(state.selections.venueKey).name;
  const views: { key: StageView; label: string }[] = [{ key: "picture", label: "Picture" }];
  if (state.venuePhotoUrl && shot?.url) views.push({ key: "compare", label: "Before / after" });
  if (state.venuePhotoUrl) views.push({ key: "venue", label: "Venue photo" }, { key: "depth", label: "Depth" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sindoor">
            Shot {pad2(index)} of {pad2(list.length)} · {catalog.time(state.selections.timeKey).name}
          </div>
          <h1 className="mt-0.5 font-display text-[40px] font-medium leading-tight max-md:text-3xl">{template.name}</h1>
          <div className="text-sm text-muted">
            {template.framing} · {venueName}
          </div>
        </div>
        {views.length > 1 && (
          <div className="flex border border-line bg-surface" role="group" aria-label="View">
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                aria-pressed={view === v.key}
                onClick={() => onViewChange(v.key)}
                className={clsx("min-h-[40px] px-3.5 text-[13px]", view === v.key ? "bg-ink text-paper" : "text-muted")}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <figure className="relative mx-auto aspect-video w-full max-w-[1000px] border border-line bg-surface p-2.5">
        <div className="relative h-full w-full overflow-hidden bg-[#f6f2ea]">
          {view === "compare" && state.venuePhotoUrl && shot?.url && (
            <BeforeAfter before={state.venuePhotoUrl} after={shot.url} afterLabel={`${template.name}, on the day`} />
          )}
          {view === "venue" && state.venuePhotoUrl && (
            <Image src={state.venuePhotoUrl} alt="Your venue photo" fill unoptimized sizes="1000px" className="object-cover" />
          )}
          {view === "depth" &&
            (state.venueDepthUrl ? (
              <>
                <Image src={state.venueDepthUrl} alt="Depth map of your venue: lighter is closer" fill unoptimized sizes="1000px" className="object-cover" />
                <figcaption className="absolute bottom-3 right-3 bg-surface px-2.5 py-1.5 text-xs">
                  {state.capabilities.realDepth ? "Lighter is closer to the camera" : "A quick stand-in sketch of the depth. Real depth needs the paid fal.ai setting."}
                </figcaption>
              </>
            ) : (
              <Centered>
                <Spinner label="Reading the venue's depth…" />
              </Centered>
            ))}
          {view === "picture" && (
            <>
              {clip && clip.status === "done" && clip.url && (
                <video key={clip.id} src={clip.url} autoPlay controls playsInline className="absolute inset-0 h-full w-full object-cover" />
              )}
              {clip && clip.status === "done" && clip.previewOnly && shot?.url && (
                <Image
                  key={`${clip.id}-${clip.updatedAt}`}
                  src={shot.url}
                  alt={`${template.name}, ${catalog.move(clip.moveKey).name.toLowerCase()} preview`}
                  fill
                  unoptimized
                  sizes="1000px"
                  className={`object-cover move-${clip.moveKey}`}
                />
              )}
              {!clip && shot?.url && (
                <Image
                  key={shot.updatedAt}
                  src={shot.url}
                  alt={`${template.name} for ${state.brideName} and ${state.groomName}`}
                  fill
                  unoptimized
                  sizes="1000px"
                  className={clsx("develop object-cover", working && "opacity-40")}
                />
              )}
              {!shot?.url && !working && shot?.status !== "failed" && (
                <Centered>
                  <p className="text-sm text-muted">Not drawn yet. Go to Shots to draw it.</p>
                </Centered>
              )}
              {working && (
                <Centered>
                  <span className="bg-surface/90 px-3 py-2 text-sm">
                    <Spinner label={job?.progress ? `${job.progress}…` : shot?.status === "queued" ? "Waiting its turn…" : "Drawing…"} />
                  </span>
                </Centered>
              )}
              {shot?.status === "failed" && (
                <Centered>
                  <div className="flex flex-col items-center gap-3 bg-surface/95 p-4 text-center text-sm">
                    <p>{shot.error ?? "This picture could not be made."}</p>
                    <Button onClick={onRetry}>Try again</Button>
                  </div>
                </Centered>
              )}
            </>
          )}
        </div>
      </figure>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 grid place-items-center p-4">{children}</div>;
}
