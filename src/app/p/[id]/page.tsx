import { redirect } from "next/navigation";

/** /p/<id> opens the first step. */
export default async function ProjectIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/p/${id}/couple`);
}
