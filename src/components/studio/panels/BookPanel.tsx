"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { catalog } from "@/config/catalog";
import type { PanelProps } from "../Studio";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Note";
import { Spinner } from "@/components/ui/Spinner";
import { PanelHeader } from "./PanelHeader";

export function BookPanel({ project }: PanelProps) {
  const { state } = project;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const selectionsKey = JSON.stringify(state.selections);

  useEffect(() => {
    let cancelled = false;
    api
      .getQuote(state.id)
      .then((q) => !cancelled && setQuote(q))
      .catch(() => !cancelled && setMessage("We couldn’t load the price estimate. Refresh the page to try again."));
    return () => {
      cancelled = true;
    };
  }, [state.id, selectionsKey]);

  const askVendors = async () => {
    setSending(true);
    try {
      const res = await api.requestQuotes(state.id);
      setMessage(`Request saved. ${res.vendorCount} matching vendors will be asked to quote on this look.`);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const copyMessage = async () => {
    const s = state.selections;
    const text = `${state.brideName} and ${state.groomName}, your wedding preview is ready: ${catalog.theme(s.themeKey).name.toLowerCase()} décor with ${catalog.flower(s.flowerKey).name.toLowerCase()}, ${catalog.brideOutfit(s.brideOutfitKey).name.toLowerCase()} and ${catalog.groomOutfit(s.groomOutfitKey).name.toLowerCase()}. Open it here: ${window.location.origin}/p/${state.id}/shots`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Message copied. Paste it into WhatsApp or email.");
    } catch {
      setMessage(text);
    }
  };

  return (
    <>
      <PanelHeader title="Book this look" help="The look the couple approves becomes a priced décor list that vendors can quote on." />
      {!quote ? (
        <Spinner label="Working out prices…" />
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {quote.lines.map((l) => (
                <tr key={l.key} className="border-b border-line align-top">
                  <td className="py-2.5">
                    {l.label}
                    <br />
                    <span className="text-xs text-muted">{l.detail}</span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right tabular-nums">
                    {formatInr(l.low)} – {formatInr(l.high)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between gap-3 font-semibold">
            <span>Décor estimate</span>
            <span className="whitespace-nowrap tabular-nums">
              {formatInr(quote.totalLow)} – {formatInr(quote.totalHigh)}
            </span>
          </div>
          <p className="text-xs text-muted">Indicative ranges. Vendors confirm their own prices when they quote.</p>
        </>
      )}
      <Button variant="solid" disabled={sending || !quote} onClick={askVendors}>
        {sending ? "Sending…" : "Ask 3 vendors for quotes"}
      </Button>
      <Button onClick={copyMessage}>Copy a message for the couple</Button>
      {message && <Note>{message}</Note>}
    </>
  );
}
