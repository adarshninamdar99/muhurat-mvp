import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/server/db/client";
import { NotFoundError } from "@/server/services/errors";
import { getProjectState } from "@/server/services/projects";
import { Studio } from "@/components/studio/Studio";
import { isStepKey, STEPS } from "@/components/studio/steps";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; step: string }> };

function load(id: string) {
  try {
    return getProjectState(getDb(), id);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, step } = await params;
  const state = load(id);
  const stepTitle = STEPS.find((s) => s.key === step)?.title ?? "Preview";
  return { title: state ? `${stepTitle} · ${state.brideName} & ${state.groomName}` : "Preview not found", robots: { index: false } };
}

export default async function StudioPage({ params }: Props) {
  const { id, step } = await params;
  if (!isStepKey(step)) notFound();
  const state = load(id);
  if (!state) notFound();
  return <Studio key={step} initial={state} step={step} />;
}
