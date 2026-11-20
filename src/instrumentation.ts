/**
 * Next.js calls register() once when the server starts.
 * We use it to start the background job worker (Node.js runtime only) and to
 * print which AI setting is active, so the team sees it in the terminal and
 * nothing technical has to appear on the couple's screens.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWorker } = await import("@/server/jobs/worker");
    const { env } = await import("@/server/env");
    startWorker();
    const notes: Record<typeof env.AI_PROVIDER, string> = {
      mock: "demo sketches (no AI). For real pictures at no cost see docs/FREE_AI_SETUP.md",
      cloudflare: "Cloudflare Workers AI, free daily allowance (resets 5:30 am IST). Usage: /admin",
      fal: "fal.ai, paid. Costs: /admin",
    };
    console.log(`\n  Muhurat pictures: ${notes[env.AI_PROVIDER]}\n`);
  }
}
