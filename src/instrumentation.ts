/**
 * Next.js calls register() once when the server starts.
 * We use it to start the background job worker (Node.js runtime only).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWorker } = await import("@/server/jobs/worker");
    startWorker();
  }
}
