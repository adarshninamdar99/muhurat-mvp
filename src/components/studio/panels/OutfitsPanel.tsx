"use client";

import { BRIDE_OUTFITS, catalog, GROOM_OUTFITS } from "@/config/catalog";
import type { PanelProps } from "../Studio";
import { ChoiceGrid } from "@/components/ui/ChoiceGrid";
import { Note } from "@/components/ui/Note";
import { PanelHeader } from "./PanelHeader";
import { StaleNotice } from "./StaleNotice";

export function OutfitsPanel({ project }: PanelProps) {
  const { selections } = project.state;
  const bride = catalog.brideOutfit(selections.brideOutfitKey);
  const groom = catalog.groomOutfit(selections.groomOutfitKey);
  return (
    <>
      <PanelHeader title="Outfits" help="The same outfits appear in every shot. Outfits linked to a catalogue photo appear exactly as sold." />
      <StaleNotice project={project} />
      <ChoiceGrid
        label="Bride"
        choices={BRIDE_OUTFITS.map((o) => ({ key: o.key, name: o.name, swatches: [o.main, o.trim, o.veil] }))}
        value={selections.brideOutfitKey}
        onChange={(key) => project.update({ brideOutfitKey: key })}
      />
      <ChoiceGrid
        label="Groom"
        choices={GROOM_OUTFITS.map((o) => ({ key: o.key, name: o.name, swatches: [o.coat, o.trim, o.safa] }))}
        value={selections.groomOutfitKey}
        onChange={(key) => project.update({ groomOutfitKey: key })}
      />
      {(bride.productUrl || groom.productUrl) && (
        <div className="flex flex-col gap-1 text-sm">
          {bride.productUrl && (
            <a href={bride.productUrl} className="text-sindoor underline" target="_blank" rel="noreferrer">
              View the {bride.name.toLowerCase()} on A Lovers Card
            </a>
          )}
          {groom.productUrl && (
            <a href={groom.productUrl} className="text-sindoor underline" target="_blank" rel="noreferrer">
              View the {groom.name.toLowerCase()} on A Lovers Card
            </a>
          )}
        </div>
      )}
      <Note>Changing an outfit marks finished shots as out of date. Update them when you’re happy with both outfits.</Note>
    </>
  );
}
