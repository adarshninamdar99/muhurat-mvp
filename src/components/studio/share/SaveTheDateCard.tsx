"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CARD_H, CARD_W, drawSaveTheDate, formatCardDate } from "./saveTheDate";

/** Save-the-date card from the couple's portrait: pick a date and city, download a PNG or share it. */
export function SaveTheDateCard({ state }: { state: ProjectState }) {
  const storeKey = `muhurat:card:${state.id}`;
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);

  // The portrait if it is drawn, otherwise the first drawn shot.
  const done = state.shots.filter((s) => s.status === "done" && s.url);
  const photoUrl = (done.find((s) => s.templateKey === "portrait") ?? done[0])?.url ?? null;

  // Remember the date and city in this browser (nice to have; ignored if storage is blocked).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) ?? "{}") as { date?: string; city?: string };
      setDate(saved.date ?? "");
      setCity(saved.city ?? "");
    } catch {
      /* storage unavailable */
    }
  }, [storeKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify({ date, city }));
    } catch {
      /* storage unavailable */
    }
  }, [storeKey, date, city]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const fonts = Promise.all([
      document.fonts?.load(`400 96px "Bodoni Moda"`),
      document.fonts?.load(`italic 400 40px "Bodoni Moda"`),
      document.fonts?.load(`600 24px "Work Sans"`),
    ]).catch(() => undefined);
    const photo = new Promise<HTMLImageElement | null>((resolve) => {
      if (!photoUrl) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = photoUrl;
    });
    void Promise.all([fonts, photo]).then(([, img]) => {
      if (cancelled) return;
      photoRef.current = img;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ready || !ctx) return;
    drawSaveTheDate(ctx, photoRef.current, { bride: state.brideName, groom: state.groomName, date: formatCardDate(date), city: city.trim() });
  }, [ready, date, city, state.brideName, state.groomName]);

  const fileName = `${state.brideName}-${state.groomName}-save-the-date.png`.replace(/\s+/g, "-").toLowerCase();
  const toBlob = () => new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, "image/png") ?? resolve(null));

  const downloadPng = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const share = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Save the date" }).catch(() => undefined);
    } else {
      await downloadPng();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="label-caps">Save-the-date card</div>
      {!photoUrl && <p className="text-sm text-muted">Create the “Couple portrait” shot first. It becomes the photo on the card.</p>}
      <canvas ref={canvasRef} width={CARD_W} height={CARD_H} className="w-full border border-line bg-paper" aria-label="Save-the-date card preview" />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps">Wedding date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-0 border-b border-[#bdb3a3] bg-transparent py-1.5 focus:border-sindoor focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label-caps">City</span>
          <input value={city} maxLength={40} placeholder="Udaipur" onChange={(e) => setCity(e.target.value)} className="border-0 border-b border-[#bdb3a3] bg-transparent py-1.5 focus:border-sindoor focus:outline-none" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="solid" disabled={!ready} onClick={downloadPng}>
          Download card
        </Button>
        <Button disabled={!ready} onClick={share}>
          Share…
        </Button>
      </div>
    </div>
  );
}
