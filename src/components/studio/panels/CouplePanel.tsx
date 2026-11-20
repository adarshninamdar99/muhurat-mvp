"use client";

import Image from "next/image";
import { useState } from "react";
import type { PanelProps } from "../Studio";
import { Note } from "@/components/ui/Note";
import { PanelHeader } from "./PanelHeader";
import { StaleNotice } from "./StaleNotice";

const MAX = 5;

export function CouplePanel({ project }: PanelProps) {
  const { state } = project;
  return (
    <>
      <PanelHeader title="The couple" help="Add 3 to 5 clear photos of each person. Their faces are reused in every shot, so these photos matter most." />
      <div className="grid grid-cols-2 gap-4">
        <NameField label="Bride" value={state.brideName} onSave={(v) => project.update({ brideName: v })} />
        <NameField label="Groom" value={state.groomName} onSave={(v) => project.update({ groomName: v })} />
      </div>
      <PersonPhotos person="bride" name={state.brideName} project={project} />
      <PersonPhotos person="groom" name={state.groomName} project={project} />
      <Note>Best results: face clearly visible, good light, no sunglasses, a mix of front and slight side angles.</Note>
      <StaleNotice project={project} />
    </>
  );
}

function NameField({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value);
  const id = `name-${label.toLowerCase()}`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="label-caps">
        {label}
      </label>
      <input
        id={id}
        value={text}
        maxLength={60}
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text.trim() && text.trim() !== value && onSave(text.trim())}
        className="w-full border-0 border-b border-[#bdb3a3] bg-transparent py-1.5 text-base focus:border-sindoor focus:outline-none"
      />
    </div>
  );
}

function PersonPhotos({ person, name, project }: { person: "bride" | "groom"; name: string; project: PanelProps["project"] }) {
  const mine = project.state.photos.filter((p) => p.person === person);
  const inputId = `upload-${person}`;
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-baseline justify-between">
        <b className="font-medium">{name}</b>
        <span className="text-xs text-muted">
          {mine.length} of {MAX} photos
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {mine.map((p) => (
          <div key={p.id} className="group relative h-16 w-16 overflow-hidden rounded-full border border-line">
            <Image src={p.url} alt={`Photo of ${name}`} fill unoptimized sizes="64px" className="object-cover" />
            <button
              type="button"
              onClick={() => project.removePhoto(p.id)}
              className="absolute inset-0 grid place-items-center bg-ink/60 text-xs text-paper opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
              aria-label={`Remove this photo of ${name}`}
            >
              Remove
            </button>
          </div>
        ))}
        {mine.length < MAX && (
          <>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only sr-only-focusable"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) await project.uploadPhoto(person, file);
              }}
            />
            <label
              htmlFor={inputId}
              className="grid h-16 w-16 cursor-pointer place-items-center rounded-full border border-dashed border-[#9d9488] text-center text-[11px] leading-tight text-muted hover:border-ink hover:text-ink"
            >
              {project.pending ? "Adding…" : "Add photo"}
            </label>
          </>
        )}
      </div>
    </div>
  );
}
