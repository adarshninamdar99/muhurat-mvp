import type { ProjectState, Quote, Selections } from "./types";

/**
 * Browser-side client for the Muhurat API. Every call throws an Error whose
 * message is safe to show the user.
 */
async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body as T;
}

const jsonInit = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const api = {
  createProject: (brideName: string, groomName: string) =>
    call<{ id: string }>("/api/projects", jsonInit("POST", { brideName, groomName })),
  getProject: (id: string) => call<ProjectState>(`/api/projects/${id}`, { cache: "no-store" }),
  updateProject: (id: string, changes: Partial<Selections> & { brideName?: string; groomName?: string }) =>
    call<ProjectState>(`/api/projects/${id}`, jsonInit("PATCH", changes)),
  uploadPhoto: (id: string, person: "bride" | "groom", file: File) => {
    const form = new FormData();
    form.append("person", person);
    form.append("file", file);
    return call<ProjectState>(`/api/projects/${id}/photos`, { method: "POST", body: form });
  },
  removePhoto: (id: string, photoId: string) => call<ProjectState>(`/api/projects/${id}/photos/${photoId}`, { method: "DELETE" }),
  uploadVenue: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return call<ProjectState>(`/api/projects/${id}/venue`, { method: "POST", body: form });
  },
  clearVenue: (id: string) => call<ProjectState>(`/api/projects/${id}/venue`, { method: "DELETE" }),
  drawShots: (id: string, templateKeys: string[]) => call<ProjectState>(`/api/projects/${id}/shots`, jsonInit("POST", { templateKeys })),
  makeClip: (id: string, shotId: string, moveKey: string) =>
    call<ProjectState>(`/api/projects/${id}/clips`, jsonInit("POST", { shotId, moveKey })),
  getQuote: (id: string) => call<Quote>(`/api/projects/${id}/quote`, { cache: "no-store" }),
  requestQuotes: (id: string) => call<{ id: string; vendorCount: number }>(`/api/projects/${id}/quote`, { method: "POST" }),
};
