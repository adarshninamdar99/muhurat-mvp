"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

/** Starts a new preview and opens its first step. */
export function NewPreviewForm() {
  const router = useRouter();
  const [bride, setBride] = useState("");
  const [groom, setGroom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bride.trim() || !groom.trim()) {
      setError("Enter both names to start.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { id } = await api.createProject(bride.trim(), groom.trim());
      router.push(`/p/${id}/couple`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 border border-line bg-surface p-6" noValidate>
      <h2 className="font-display text-2xl font-medium">Start a new preview</h2>
      <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
        <Field id="bride" label="Bride’s name" value={bride} onChange={setBride} />
        <Field id="groom" label="Groom’s name" value={groom} onChange={setGroom} />
      </div>
      {error && (
        <p className="text-sm text-sindoor" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="solid" disabled={saving}>
        {saving ? "Starting…" : "Start"}
      </Button>
    </form>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="label-caps">
        {label}
      </label>
      <input
        id={id}
        value={value}
        maxLength={60}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="border-0 border-b border-[#bdb3a3] bg-transparent py-1.5 text-base focus:border-sindoor focus:outline-none"
      />
    </div>
  );
}
