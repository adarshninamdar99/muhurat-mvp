"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ProjectState, Selections } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

const POLL_MS = 1500;

/** True while any background job, shot or clip is still in progress. */
export function isBusy(state: ProjectState): boolean {
  return (
    state.activeJobs.length > 0 ||
    state.shots.some((s) => s.status === "queued" || s.status === "running") ||
    state.clips.some((c) => c.status === "queued" || c.status === "running")
  );
}

/**
 * Holds the project's state in the browser, polls the server while work is
 * running, and exposes one function per user action.
 */
export function useProjectState(initial: ProjectState) {
  const [state, setState] = useState(initial);
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const id = initial.id;
  const busy = isBusy(state);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!busy) return;
    timer.current = setTimeout(async () => {
      try {
        setState(await api.getProject(id));
      } catch {
        // Network blip: the next poll will try again.
      }
    }, POLL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [busy, id, state]);

  /** Runs one action, updates state from the response, shows errors as a message. */
  const act = useCallback(
    async (fn: () => Promise<ProjectState>, success?: string) => {
      setPending(true);
      try {
        setState(await fn());
        if (success) toast(success);
        return true;
      } catch (err) {
        toast((err as Error).message);
        return false;
      } finally {
        setPending(false);
      }
    },
    [toast],
  );

  return {
    state,
    busy,
    pending,
    update: (changes: Partial<Selections> & { brideName?: string; groomName?: string }) => act(() => api.updateProject(id, changes)),
    uploadPhoto: (person: "bride" | "groom", file: File) => act(() => api.uploadPhoto(id, person, file), "Photo added"),
    removePhoto: (photoId: string) => act(() => api.removePhoto(id, photoId), "Photo removed"),
    uploadVenue: (file: File) => act(() => api.uploadVenue(id, file), "Venue photo added. Reading its depth…"),
    clearVenue: () => act(() => api.clearVenue(id), "Venue photo removed"),
    drawShots: (keys: string[]) => act(() => api.drawShots(id, keys)),
    makeClip: (shotId: string, moveKey: string) => act(() => api.makeClip(id, shotId, moveKey)),
  };
}

export type ProjectActions = ReturnType<typeof useProjectState>;
