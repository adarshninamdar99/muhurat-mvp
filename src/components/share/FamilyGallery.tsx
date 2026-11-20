"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SharedView } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FilmPlayer } from "@/components/studio/film/WeddingFilm";

/** A random ID kept in this browser so one person counts once per picture. */
function voterId(): string {
  const key = "muhurat:voter";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID(); // Storage blocked: votes still work for this visit.
  }
}

export function FamilyGallery({ token, initial }: { token: string; initial: SharedView }) {
  const [view, setView] = useState(initial);
  const [me, setMe] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [film, setFilm] = useState(false);

  useEffect(() => {
    const id = voterId();
    setMe(id);
    api.getShared(token, id).then(setView).catch(() => undefined);
  }, [token]);

  const toggle = async (templateKey: string, love: boolean) => {
    if (!me) return;
    setBusyKey(templateKey);
    setError(null);
    try {
      setView(await api.vote(token, { templateKey, voterId: me, voterName: name || undefined, love }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyKey(null);
    }
  };

  const filmShots = view.shots.map((s) => ({ key: s.templateKey, name: s.name, url: s.url }));
  const filmText = {
    bride: view.brideName,
    groom: view.groomName,
    kicker: `A ${view.traditionName} wedding`,
    detail: `${view.timeName} · ${view.venueName}`,
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sindoor">A {view.traditionName} wedding</span>
        <h1 className="font-display text-5xl font-normal leading-tight max-sm:text-4xl">
          {view.brideName} <i className="text-sindoor">&</i> {view.groomName}
        </h1>
        <p className="font-display text-lg italic text-muted">
          {view.timeName} · {view.venueName}
        </p>
        <p className="mt-3 max-w-md text-[15px]">
          Help us choose. Tap <span className="text-sindoor">♥</span> on the pictures you love. {view.brideName} and {view.groomName} will see the family’s favourites.
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-center gap-3">
          <label className="flex flex-col gap-1 text-left text-sm">
            <span className="label-caps">Your name (optional)</span>
            <input
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="Asha aunty"
              className="w-56 border-0 border-b border-[#bdb3a3] bg-transparent py-1.5 focus:border-sindoor focus:outline-none"
            />
          </label>
          {filmShots.length >= 2 && (
            <Button variant="solid" onClick={() => setFilm(true)}>
              Watch the film
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-sindoor">{error}</p>}
      </header>

      {view.shots.length === 0 ? (
        <p className="text-center text-muted">No pictures yet. Check back soon: the pictures are still being made.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
          {view.shots.map((s) => (
            <li key={s.templateKey} className="flex flex-col gap-2">
              <div className="relative aspect-video overflow-hidden border border-line bg-surface p-1.5">
                <div className="relative h-full w-full">
                  <Image src={s.url} alt={s.name} fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-xl italic">{s.name}</span>
                <button
                  type="button"
                  aria-pressed={s.mine}
                  disabled={!me || busyKey === s.templateKey}
                  onClick={() => toggle(s.templateKey, !s.mine)}
                  className={clsx(
                    "inline-flex min-h-[44px] min-w-[88px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-50",
                    s.mine ? "border-sindoor bg-sindoor text-paper" : "border-line text-ink hover:border-sindoor",
                  )}
                >
                  <span aria-hidden="true">♥</span>
                  <span className="tabular-nums">{s.votes}</span>
                  <span className="sr-only">{s.mine ? "You love this. Tap to undo." : "Love this picture"}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto border-t border-line pt-4 text-center text-xs text-muted">Wedding preview made with Muhurat for A Lovers Card</footer>
      {film && <FilmPlayer shots={filmShots} text={filmText} onClose={() => setFilm(false)} />}
    </main>
  );
}
