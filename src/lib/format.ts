/** Formatting helpers shared by server and browser. */

export function formatInr(amount: number, decimals = 0): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Rounds a rupee estimate to the nearest ₹500 for display. */
export function roundTo500(amount: number): number {
  return Math.round(amount / 500) * 500;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
