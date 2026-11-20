"use client";

import Image from "next/image";
import { VENUES } from "@/config/catalog";
import type { PanelProps } from "../Studio";
import { Button } from "@/components/ui/Button";
import { ChoiceGrid } from "@/components/ui/ChoiceGrid";
import { Note } from "@/components/ui/Note";
import { Spinner } from "@/components/ui/Spinner";
import { PanelHeader } from "./PanelHeader";
import { StaleNotice } from "./StaleNotice";

export function VenuePanel({ project, setView }: PanelProps) {
  const { state } = project;
  const analysing = state.activeJobs.some((j) => j.type === "analyze_venue");
  return (
    <>
      <PanelHeader title="The venue" help="Upload a photo of the real venue for the most accurate pictures. No photo yet? Pick the closest type below." />

      <div className="flex flex-col gap-3 border-t border-line pt-3">
        <div className="label-caps">Venue photo</div>
        {state.venuePhotoUrl ? (
          <>
            <div className="relative aspect-video overflow-hidden border border-line">
              <Image src={state.venuePhotoUrl} alt="Your venue" fill unoptimized sizes="320px" className="object-cover" />
            </div>
            {analysing ? (
              <Spinner label="Reading the venue’s depth…" />
            ) : (
              <Button variant="quiet" onClick={() => setView("depth")}>
                See the depth map
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <UploadButton label="Replace photo" onFile={project.uploadVenue} disabled={project.pending} />
              <Button variant="quiet" onClick={project.clearVenue} disabled={project.pending}>
                Remove photo
              </Button>
            </div>
          </>
        ) : (
          <UploadButton label="Upload a venue photo" onFile={async (f) => (await project.uploadVenue(f)) && setView("venue")} disabled={project.pending} solid />
        )}
      </div>

      <ChoiceGrid
        label={state.venuePhotoUrl ? "Venue type (used only without a photo)" : "Venue type"}
        columns={1}
        choices={VENUES.map((v) => ({ key: v.key, name: v.name, sub: v.sub }))}
        value={state.selections.venueKey}
        onChange={(key) => project.update({ venueKey: key })}
        disabled={Boolean(state.venuePhotoUrl)}
      />
      <Note>A wide photo taken from where guests sit works best. The depth map shows what’s near and far, so décor lands on the right surfaces.</Note>
      <StaleNotice project={project} />
    </>
  );
}

function UploadButton({ label, onFile, disabled, solid }: { label: string; onFile: (f: File) => Promise<unknown>; disabled?: boolean; solid?: boolean }) {
  const id = `venue-upload-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="relative">
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only sr-only-focusable"
        disabled={disabled}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) await onFile(file);
        }}
      />
      <label
        htmlFor={id}
        className={`flex min-h-[42px] w-full cursor-pointer items-center justify-center border px-4 text-sm font-medium ${solid ? "border-ink bg-ink text-paper" : "border-line hover:border-[#bdb3a3]"}`}
      >
        {label}
      </label>
    </div>
  );
}
