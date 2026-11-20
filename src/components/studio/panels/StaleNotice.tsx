"use client";

import { Button } from "@/components/ui/Button";
import type { ProjectActions } from "../useProjectState";

/** Appears when choices changed after pictures were drawn, with one button to update them. */
export function StaleNotice({ project }: { project: ProjectActions }) {
  const stale = project.state.shots.filter((s) => s.stale);
  if (stale.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 border border-haldi/60 bg-[#fbf3e3] p-3 text-sm">
      <p>
        Your changes aren’t in {stale.length} picture{stale.length === 1 ? "" : "s"} yet.
      </p>
      <Button variant="solid" disabled={project.pending || project.busy} onClick={() => project.drawShots(stale.map((s) => s.templateKey))}>
        Update {stale.length} picture{stale.length === 1 ? "" : "s"}
      </Button>
    </div>
  );
}
