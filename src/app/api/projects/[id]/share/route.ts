import QRCode from "qrcode";
import { getDb } from "@/server/db/client";
import { json, route, type Params } from "@/server/http";
import { publicBaseUrl } from "@/server/publicUrl";
import { getOrCreateShareToken } from "@/server/services/share";

/**
 * POST /api/projects/:id/share: get (or make) the family share link.
 * Returns { path, url, qrSvg }. `url` works from a phone; `qrSvg` is a QR code of it.
 */
export const POST = route(async (req, { params }: Params<{ id: string }>) => {
  const { id } = await params;
  const token = getOrCreateShareToken(getDb(), id);
  const path = `/share/${token}`;
  const url = `${publicBaseUrl(req)}${path}`;
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1F1A17", light: "#FFFFFF" } });
  return json({ path, url, qrSvg });
});
