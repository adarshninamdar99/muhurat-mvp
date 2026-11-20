"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { catalog } from "@/config/catalog";
import type { ProjectState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { drawFrame, FILM_H, FILM_W, type FilmText } from "./draw";
import { Tanpura } from "./tanpura";
import { buildFilm, type FilmShot } from "./timeline";

/**
 * "Our wedding film": every drawn shot stitched into a short film with slow
 * camera moves, title cards and a synthesised tanpura drone. Made entirely in
 * the browser (canvas + Web Audio), so it costs nothing and works on the free
 * AI setting. "Download" records it to a video file with MediaRecorder.
 */

/** Shots that are drawn, in the tradition's order. */
export function filmShots(state: ProjectState): FilmShot[] {
  return catalog.tradition(state.selections.traditionKey).shots.flatMap((key) => {
    const shot = state.shots.find((s) => s.templateKey === key && s.status === "done" && s.url);
    return shot ? [{ key, name: catalog.shot(key).name, url: shot.url! }] : [];
  });
}

export function filmText(state: ProjectState): FilmText {
  const venue = state.venuePhotoUrl ? "Our venue" : catalog.venue(state.selections.venueKey).name;
  return {
    bride: state.brideName,
    groom: state.groomName,
    kicker: `A ${catalog.tradition(state.selections.traditionKey).name} wedding`,
    detail: `${catalog.time(state.selections.timeKey).name} · ${venue}`,
  };
}

export function WeddingFilmButton({ state }: { state: ProjectState }) {
  const [open, setOpen] = useState(false);
  const shots = filmShots(state);
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="label-caps">Our wedding film</div>
      <p className="text-sm text-muted">All your drawn shots as one short film, with title cards and soft tanpura music. Free, made in your browser.</p>
      <Button disabled={shots.length < 2} onClick={() => setOpen(true)}>
        {shots.length < 2 ? "Draw at least 2 shots to make the film" : `Play the film (${shots.length} shots)`}
      </Button>
      {open && <FilmPlayer shots={shots} text={filmText(state)} onClose={() => setOpen(false)} />}
    </div>
  );
}

type Mode = "loading" | "playing" | "recording" | "ended";

export function FilmPlayer(props: { shots: FilmShot[]; text: FilmText; onClose: () => void }) {
  // Snapshot the shots and words when the player opens, so background updates
  // (polling, votes) don't restart the film halfway through.
  const [{ shots, text }] = useState(() => ({ shots: props.shots, text: props.text }));
  const { onClose } = props;
  const film = useMemo(() => buildFilm(shots), [shots]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const audioRef = useRef<Tanpura | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const frameRef = useRef(0);
  const [mode, setMode] = useState<Mode>("loading");
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const stopLoop = () => cancelAnimationFrame(frameRef.current);

  /** Plays the film from the start. When `record` is true, also saves it to a video file. */
  const play = useCallback(
    async (record: boolean) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      stopLoop();
      audioRef.current ??= safeTanpura();
      const audio = audioRef.current;
      await audio?.start();

      if (record) {
        const mime = pickMimeType();
        if (!mime || typeof canvas.captureStream !== "function") {
          setError("This browser can’t save video. Try Chrome or Edge on a computer.");
          return;
        }
        const stream = canvas.captureStream(30);
        audio?.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
        recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
        recorder.onstop = () => download(new Blob(chunks, { type: mime }), `${slug(text.bride)}-${slug(text.groom)}-wedding-film.${mime.includes("mp4") ? "mp4" : "webm"}`);
        recorder.start(500);
        recorderRef.current = recorder;
      }

      setMode(record ? "recording" : "playing");
      const startedAt = performance.now();
      let fading = false;
      const tick = () => {
        const t = (performance.now() - startedAt) / 1000;
        drawFrame(ctx, film, Math.min(t, film.duration), imagesRef.current, text);
        setTime(t);
        if (!fading && t >= film.duration - 1.6) {
          fading = true;
          audio?.fadeOut(1.5);
        }
        if (t < film.duration) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          recorderRef.current?.stop();
          recorderRef.current = null;
          setMode("ended");
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [film, text],
  );

  // Load fonts and pictures, then start playing.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await Promise.all([
        document.fonts?.load(`400 84px "Bodoni Moda"`).catch(() => undefined),
        document.fonts?.load(`italic 400 44px "Bodoni Moda"`).catch(() => undefined),
        document.fonts?.load(`600 15px "Work Sans"`).catch(() => undefined),
        ...shots.map(
          (s) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                imagesRef.current.set(s.key, img);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = s.url;
            }),
        ),
      ]);
      if (!cancelled) void play(false);
    };
    void load();
    closeRef.current?.focus();
    return () => {
      cancelled = true;
      stopLoop();
      recorderRef.current?.stop();
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, [shots, play]);

  // Esc closes the player.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleMute = () => {
    setMuted((m) => {
      audioRef.current?.setMuted(!m);
      return !m;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0e0b09]/95 p-6" role="dialog" aria-modal="true" aria-label="Our wedding film">
      <canvas ref={canvasRef} width={FILM_W} height={FILM_H} className="aspect-video w-full max-w-[1100px] bg-ink" />
      <div className="flex w-full max-w-[1100px] flex-wrap items-center gap-3 text-sm text-paper">
        <span className="tabular-nums text-paper/70">
          {mode === "loading" ? "Getting the film ready…" : `${clock(Math.min(time, film.duration))} / ${clock(film.duration)}`}
          {mode === "recording" && <span className="ml-2 text-[#f2a39c]">● Recording, keep this window open</span>}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="onDark" onClick={toggleMute}>
            {muted ? "Sound on" : "Sound off"}
          </Button>
          <Button variant="onDark" disabled={mode === "loading" || mode === "recording"} onClick={() => play(false)}>
            Replay
          </Button>
          <Button variant="solid" disabled={mode === "loading" || mode === "recording"} onClick={() => play(true)}>
            {mode === "recording" ? "Saving…" : "Download film"}
          </Button>
          <Button ref={closeRef} variant="onDark" onClick={onClose}>
            Close
          </Button>
        </div>
        {error && <p className="basis-full text-[#f2a39c]">{error}</p>}
      </div>
    </div>
  );
}

function safeTanpura(): Tanpura | null {
  try {
    return new Tanpura();
  } catch {
    return null; // No Web Audio: the film still plays, silently.
  }
}

function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const options = ["video/mp4;codecs=avc1,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "couple";
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
