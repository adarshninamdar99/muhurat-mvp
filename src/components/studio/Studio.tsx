"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ANCHOR_SHOT_KEY, catalog } from "@/config/catalog";
import { formatInr } from "@/lib/format";
import type { ClipDTO, ProjectState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ToastProvider } from "@/components/ui/Toast";
import { Filmstrip } from "./Filmstrip";
import { ShotStage, type StageView } from "./ShotStage";
import { STEPS, type StepKey } from "./steps";
import { useProjectState, type ProjectActions } from "./useProjectState";
import { CouplePanel } from "./panels/CouplePanel";
import { VenuePanel } from "./panels/VenuePanel";
import { DecorPanel } from "./panels/DecorPanel";
import { OutfitsPanel } from "./panels/OutfitsPanel";
import { ShotsPanel } from "./panels/ShotsPanel";
import { VideoPanel } from "./panels/VideoPanel";
import { BookPanel } from "./panels/BookPanel";
import { SharePanel } from "./panels/SharePanel";

/** Props every step panel receives. */
export interface PanelProps {
  project: ProjectActions;
  activeKey: string;
  setActiveKey: (key: string) => void;
  playClip: (clip: ClipDTO | null) => void;
  setView: (view: StageView) => void;
}

const PANELS: Record<StepKey, (p: PanelProps) => React.ReactNode> = {
  couple: CouplePanel,
  venue: VenuePanel,
  decor: DecorPanel,
  outfits: OutfitsPanel,
  shots: ShotsPanel,
  video: VideoPanel,
  share: SharePanel,
  book: BookPanel,
};

export function Studio(props: { initial: ProjectState; step: StepKey }) {
  return (
    <ToastProvider>
      <StudioInner {...props} />
    </ToastProvider>
  );
}

function StudioInner({ initial, step }: { initial: ProjectState; step: StepKey }) {
  const project = useProjectState(initial);
  const { state } = project;
  const router = useRouter();
  const [chosenKey, setActiveKey] = useState<string>(defaultShotFor(step, initial.selections.traditionKey));
  // If the couple switches tradition, a ritual shot from the old one falls back to the first shot.
  const traditionShots = catalog.tradition(state.selections.traditionKey).shots;
  const activeKey = traditionShots.includes(chosenKey) ? chosenKey : ANCHOR_SHOT_KEY;
  const [view, setView] = useState<StageView>(step === "venue" && initial.venuePhotoUrl ? "venue" : "picture");
  const [clip, setClip] = useState<ClipDTO | null>(null);
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const next = STEPS[stepIndex + 1];
  const prev = STEPS[stepIndex - 1];
  const Panel = PANELS[step];

  // Arrow keys move between steps (handy when presenting).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" && next) router.push(`/p/${state.id}/${next.key}`);
      if (e.key === "ArrowLeft" && prev) router.push(`/p/${state.id}/${prev.key}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router, state.id]);

  const selectShot = (key: string) => {
    setActiveKey(key);
    setClip(null);
    setView("picture");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-7 gap-y-2 border-b border-line bg-paper px-7 py-3.5 max-md:px-4">
        <Link href="/" className="flex min-w-[150px] flex-col leading-tight">
          <span className="font-display text-[28px] font-medium italic">Muhurat</span>
          <span className="text-xs text-muted">for A Lovers Card</span>
        </Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto max-lg:order-3 max-lg:basis-full" aria-label="Steps">
          {STEPS.map((s, i) => (
            <Link
              key={s.key}
              href={`/p/${state.id}/${s.key}`}
              aria-current={s.key === step ? "step" : undefined}
              className={clsx(
                "flex min-h-[44px] items-center whitespace-nowrap border-b-2 px-2.5 text-sm",
                s.key === step ? "border-sindoor font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              <span className={clsx("mr-1.5 text-xs tabular-nums", i < stepIndex && "text-sindoor")}>{i + 1}</span>
              {s.title}
            </Link>
          ))}
        </nav>
        <div className="flex gap-2">
          {prev && (
            <Button variant="quiet" onClick={() => router.push(`/p/${state.id}/${prev.key}`)}>
              Back
            </Button>
          )}
          {next && (
            <Button variant="solid" onClick={() => router.push(`/p/${state.id}/${next.key}`)}>
              Next: {next.title}
            </Button>
          )}
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-74px)] grid-cols-[minmax(0,1fr)_360px] max-lg:grid-cols-[minmax(0,1fr)_320px] max-md:grid-cols-1">
        <section className="flex min-w-0 flex-col gap-4 px-8 py-6 max-md:px-4" aria-label="Current shot">
          <ShotStage
            state={state}
            activeKey={activeKey}
            view={view}
            onViewChange={setView}
            clip={clip && clip.shotId === state.shots.find((s) => s.templateKey === activeKey)?.id ? clip : null}
            onRetry={() => project.drawShots([activeKey])}
          />
          <Filmstrip
            shots={state.shots}
            traditionKey={state.selections.traditionKey}
            votes={state.votes}
            active={activeKey}
            onSelect={selectShot}
          />
        </section>
        <aside className="flex flex-col gap-5 border-l border-line bg-surface px-6 py-6 max-md:border-l-0 max-md:border-t max-md:px-4">
          <Panel project={project} activeKey={activeKey} setActiveKey={selectShot} playClip={setClip} setView={setView} />
          <p className="mt-auto border-t border-line pt-3.5 text-[13px] text-muted">
            So far: <b className="text-ink">{state.spend.images}</b> pictures and <b className="text-ink">{state.spend.clips}</b> clips,{" "}
            {state.provider === "mock" ? (
              <>in free demo mode.</>
            ) : state.provider === "cloudflare" ? (
              <>
                all <b className="text-ink">free</b>.
              </>
            ) : (
              <>
                about <b className="text-ink">{formatInr(state.spend.inr, 2)}</b> in AI costs.
              </>
            )}
          </p>
        </aside>
      </main>

      {state.provider === "mock" && (
        <footer className="border-t border-line px-7 py-3 text-xs text-muted max-md:px-4">
          Demo mode: pictures are storyboard sketches. For real AI pictures at no cost, switch to the free Cloudflare setting (see docs/FREE_AI_SETUP.md).
        </footer>
      )}
    </div>
  );
}

function defaultShotFor(step: StepKey, traditionKey: string): string {
  if (step === "couple" || step === "outfits") return "portrait";
  // The tradition's first ritual (varmala, malai maatral, …) shows the décor best.
  if (step === "decor") return catalog.tradition(traditionKey).shots[1] ?? ANCHOR_SHOT_KEY;
  return ANCHOR_SHOT_KEY;
}
