import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/server/db/client";
import { NotFoundError } from "@/server/services/errors";
import { getSharedView } from "@/server/services/share";
import { FamilyGallery } from "@/components/share/FamilyGallery";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

function load(token: string) {
  try {
    return getSharedView(getDb(), token);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const view = load((await params).token);
  return {
    title: view ? `${view.brideName} & ${view.groomName} · Help us choose` : "Link not found",
    robots: { index: false },
  };
}

/** Public page for family members: see the pictures, tap ♥ on favourites, watch the film. */
export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const view = load(token);
  if (!view) notFound();
  return <FamilyGallery token={token} initial={view} />;
}
