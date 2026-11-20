# Editing guide

Recipes for the changes most likely to come up. Each one lists the files to touch and how to check the result. Run `npm run check` before opening a pull request.

---

## Add a décor theme (or flower, mandap, lighting)

**File:** `src/config/catalog.ts`

1. Copy an entry in `THEMES` and give it a new, unique `key` (lowercase, no spaces).
2. Set `name` and `sub` (shown on screen), `prompt` (sent to the AI), the three swatch colours, and `priceFactor` (1 = standard price).
3. Save. The option appears in the Décor step automatically.

Never change the `key` of an option that real projects already use; saved projects store the key. To retire an option, remove it only after migrating projects that use it.

Flowers, mandaps and lighting work the same way (`FLOWERS`, `MANDAPS`, `LIGHTS`). A flower also has `ratePerKg`, which feeds the décor estimate.

## Connect a real outfit from A Lovers Card

1. Put the product photo in `public/catalog/outfits/`, e.g. `red-lehenga.jpg`.
2. In `BRIDE_OUTFITS` or `GROOM_OUTFITS` add (or edit) an entry:
   ```ts
   { key: "red-zari", name: "Red zari lehenga", prompt: "a deep red lehenga with dense gold zari work", main: "#9e1030", trim: "#d9a441", veil: "#c2185b",
     referenceImage: "/catalog/outfits/red-lehenga.jpg", productUrl: "https://www.example.com/products/red-zari" }
   ```
3. The photo is now sent with every shot as a reference, and the Outfits step shows a “View on A Lovers Card” link.

When the catalogue grows past a few dozen items, move outfits into a database table and load them through a service. The screens only need the same fields.

## Add a new shot (e.g. “Haldi”)

**File:** `src/config/catalog.ts` → `SHOT_TEMPLATES`

1. Copy an entry, set a new `key`, `name`, `framing` and `prompt` (describe the moment and camera angle plainly).
2. `camera`, `couple` and `extras` only affect the demo sketch; copy them from a similar shot.
3. Keep `entry` first: the first template is the anchor every other shot copies its look from.

The filmstrip, Shots step and API pick up the new shot automatically. The “Draw all” button will draw seven.

## Add a camera move for clips

`CAMERA_MOVES` in `src/config/catalog.ts`. To give it a demo-mode animation too, add a `move-<key>` keyframe class in `src/app/globals.css` (see the four existing ones).

## Change the wording sent to the AI

`src/server/ai/prompts.ts` holds the structure; option-specific phrases are the `prompt` fields in the catalog. After editing, run `npm test` (prompt tests), then compare a few real results. The prompt used for each shot is stored in the `shots.prompt` column (`npm run db:studio`).

## Change décor price ranges

`VENDOR_LINES` in `src/config/catalog.ts`. Each line has a `label`, a `detail` and a `range` function returning `[low, high]` in ₹. Totals and rounding to ₹500 are handled in `src/server/services/quote.ts`. To use real vendor rates, replace `range` with a lookup from your vendor data.

## Send quote requests to real vendors

`createQuoteRequest()` in `src/server/services/quoteRequests.ts` saves the request. Add the notification there (email, WhatsApp, or a call to the A Lovers Card vendor system). Keep it inside the service so the API route stays unchanged.

## Change colours, fonts or spacing

- Brand colours and fonts: `tailwind.config.ts` (`paper`, `ink`, `sindoor`, …). Every screen uses these names, so a change here applies everywhere.
- Font files: the Google Fonts link in `src/app/layout.tsx`.
- Shared components: `src/components/ui/`.

## Change a screen's text

Each step's panel is one file in `src/components/studio/panels/`. The picture area is `ShotStage.tsx`, the strip of thumbnails `Filmstrip.tsx`, the header and step tabs `Studio.tsx`. The home page is `src/app/page.tsx`.

Writing style used across the app: short sentences, say what will happen (“Draw the other 4”), errors say how to fix the problem.

## Add a database column

1. Edit `src/server/db/schema.ts`.
2. Run `npm run db:generate -- --name describe_the_change`. This writes a SQL file in `drizzle/`.
3. Commit both. The migration runs automatically on the next server start.

## Add a new kind of background job

1. Add the type to the `type` enum of the `jobs` table in `schema.ts` (and generate a migration).
2. Write a handler in `src/server/jobs/handlers/` implementing `JobHandler` (input schema, `run`, optional `onFailure`).
3. Register it in `src/server/jobs/handlers/index.ts`.
4. Queue it from a service with `enqueueJob(db, { projectId, type, payload })`.

## Use a different AI model or provider

See [AI_PIPELINE.md](AI_PIPELINE.md#changing-a-model).
