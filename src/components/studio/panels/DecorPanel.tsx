"use client";

import { FLOWERS, LIGHTS, MANDAPS, THEMES } from "@/config/catalog";
import type { PanelProps } from "../Studio";
import { ChoiceGrid } from "@/components/ui/ChoiceGrid";
import { PanelHeader } from "./PanelHeader";
import { StaleNotice } from "./StaleNotice";

export function DecorPanel({ project }: PanelProps) {
  const { selections } = project.state;
  return (
    <>
      <PanelHeader title="Décor" help="Pick colours, flowers, mandap and lighting. Every finished shot can be updated in one go." />
      <StaleNotice project={project} />
      <ChoiceGrid
        label="Colours"
        choices={THEMES.map((t) => ({ key: t.key, name: t.name, sub: t.sub, swatches: [t.drape, t.canopy, t.pillar] }))}
        value={selections.themeKey}
        onChange={(key) => project.update({ themeKey: key })}
      />
      <ChoiceGrid
        label="Flowers"
        choices={FLOWERS.map((f) => ({ key: f.key, name: f.name, swatches: f.colors }))}
        value={selections.flowerKey}
        onChange={(key) => project.update({ flowerKey: key })}
      />
      <ChoiceGrid
        label="Mandap"
        choices={MANDAPS.map((m) => ({ key: m.key, name: m.name, sub: m.sub }))}
        value={selections.mandapKey}
        onChange={(key) => project.update({ mandapKey: key })}
      />
      <ChoiceGrid
        label="Lighting"
        choices={LIGHTS.map((l) => ({ key: l.key, name: l.name, sub: l.sub }))}
        value={selections.lightKey}
        onChange={(key) => project.update({ lightKey: key })}
      />
    </>
  );
}
