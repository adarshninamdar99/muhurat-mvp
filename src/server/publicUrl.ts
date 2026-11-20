import "server-only";
import os from "node:os";
import { env } from "@/server/env";

/**
 * The address to put in links that open on another device (the family link, its QR code).
 *
 * 1. PUBLIC_BASE_URL, when set (use this on a real server).
 * 2. Otherwise the address the request came in on. If that is "localhost",
 *    it is swapped for this computer's Wi-Fi address, so a phone on the same
 *    Wi-Fi can open the link during a demo.
 */
export function publicBaseUrl(req: Request): string {
  if (env.PUBLIC_BASE_URL) return env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const [hostname, port] = host.split(":");
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    const lan = lanAddress();
    if (lan) return `${proto}://${lan}${port ? `:${port}` : ""}`;
  }
  return `${proto}://${host}`;
}

/** This computer's first private IPv4 address (Wi-Fi or Ethernet), if any. */
export function lanAddress(): string | null {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === "IPv4" && !a.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address)) return a.address;
    }
  }
  return null;
}
