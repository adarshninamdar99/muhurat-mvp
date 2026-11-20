# Deployment

Muhurat runs as **one long-lived Node.js process** with a persistent disk. The background job worker runs inside that process, so serverless platforms that freeze processes between requests (such as Vercel functions) are not suitable as-is.

Good fits for the pilot: a small VM (2 vCPU, 4 GB RAM), Railway, Render, Fly.io, or any Docker host. AI work happens on fal.ai, so the server needs no GPU.

## Option A: Docker (recommended)

```bash
docker build -t muhurat .
docker run -d --name muhurat -p 3000:3000 \
  -v muhurat-data:/app/data \
  -e AI_PROVIDER=fal -e FAL_KEY=... -e ADMIN_PASSWORD=... \
  muhurat
```

`/app/data` holds the database and every uploaded or generated file. **Keep it on a persistent volume.**

## Option B: Plain Node.js

```bash
npm ci
npm run build
NODE_ENV=production npm start   # listens on PORT (default 3000)
```

Use a process manager (systemd, pm2) to restart on failure, and put Nginx or Caddy in front for HTTPS.

## Settings

All settings are environment variables; see `.env.example`. In production set at least:

| Variable | Value |
| --- | --- |
| `AI_PROVIDER` | `fal` |
| `FAL_KEY` | your fal.ai key (keep it secret; never commit it) |
| `ADMIN_PASSWORD` | a strong password |
| `DATABASE_PATH`, `STORAGE_DIR` | paths on the persistent volume (defaults: `./data/...`) |
| `JOB_CONCURRENCY` | 2–4 (how many AI calls run at once) |

The server refuses to start if a setting is invalid, with a message naming the setting.

## Backups

Everything lives in the data folder. Back it up daily:

```bash
sqlite3 data/muhurat.db ".backup 'backup/muhurat-$(date +%F).db'"
rsync -a data/files/ backup/files/
```

## Monitoring

- `GET /api/health` for uptime checks.
- `/admin` shows spend, picture counts, average time per picture and failed jobs.
- Server logs show `[jobs]` lines for every failure.

## Scaling path (when the pilot grows)

Each step is independent; do them only when needed.

1. **Files → object storage.** Replace the four functions in `src/server/storage/local.ts` with S3, Cloudflare R2 or GCS calls. Nothing else touches the disk.
2. **SQLite → Postgres.** Change the Drizzle dialect in `drizzle.config.ts` and `src/server/db/` to `postgres-js`, port `schema.ts` to `pg-core` (the column definitions map one to one), regenerate migrations. Services use Drizzle's query builder, so most code stays the same.
3. **In-process worker → dedicated queue.** Move job processing to BullMQ (Redis) or a hosted queue, running `processJob` from `src/server/jobs/worker.ts` in a separate worker process. Handlers stay unchanged. After this step the web app itself can run on serverless platforms.
4. **Sign-in.** Add authentication (e.g. Auth.js or Clerk) and check project ownership in each API route.
