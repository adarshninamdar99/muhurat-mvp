# AI pipeline

All AI calls go through one interface, `AiProvider` (`src/server/ai/types.ts`), with three methods:

| Method | Input | Output | Real model (fal.ai) |
| --- | --- | --- | --- |
| `analyzeVenue` | Venue photo | Depth map PNG (lighter = closer) | [`fal-ai/image-preprocessors/depth-anything/v2`](https://fal.ai/models/fal-ai/image-preprocessors/depth-anything/v2) |
| `generateShot` | Prompt + reference images | One 16:9 JPEG | [`fal-ai/nano-banana/edit`](https://fal.ai/models/fal-ai/nano-banana/edit) |
| `generateClip` | Prompt + one still | 5-second 720p MP4 | [`fal-ai/wan/v2.2-a14b/image-to-video/turbo`](https://fal.ai/models/fal-ai/wan/v2.2-a14b/image-to-video/turbo) |

Model IDs live in `src/server/ai/providers/fal/models.ts`. The provider is chosen by `AI_PROVIDER`:

| `AI_PROVIDER` | Pictures | Depth | Clips | Cost |
| --- | --- | --- | --- | --- |
| `mock` | Storyboard sketches | Stand-in | Browser camera move | ₹0 |
| `cloudflare` | `@cf/black-forest-labs/flux-2-klein-4b` (up to 4 references) | Stand-in | Browser camera move | ₹0, ~80 pictures a day ([setup](FREE_AI_SETUP.md)) |
| `fal` | Nano Banana Edit (up to 8 references) | Depth Anything V2 | Wan 2.2 | see Cost |

Each provider declares `maxReferences`, `referenceIndexBase` (does the model count images from 0 or 1) and `capabilities` (`realPictures`, `realDepth`, `realVideo`). The screens read `capabilities` so stand-ins are always labelled honestly.

## Reference images for a shot

`buildShotRequest()` in `src/server/services/shots.ts` collects references in priority order, then keeps as many as the provider accepts (`maxReferences`):

1. The bride's first photo (`the bride, photo 1 (face reference)`)
2. The groom's first photo
3. The anchor shot, for every shot except the anchor itself (`an earlier photo from this same wedding`)
4. The venue photo, if uploaded (`the wedding venue`)
5. The bride's outfit catalogue photo, if set in the catalog
6. The groom's outfit catalogue photo, if set
7. The second photo of the bride, then of the groom

So on the free setting (4 references) a shot gets both faces, the anchor and the venue; on fal.ai (8) it gets everything. The label of each reference is used in the prompt (“image 3 is the wedding venue”, numbered from 0 or 1 to suit the model), so the order and the labels must stay in step. The prompt builder finds references by their label prefix.

## The prompt

`buildShotPrompt()` in `src/server/ai/prompts.ts` writes a short, structured instruction:

```
Create a photorealistic photograph from a North Indian Hindu wedding, taken at golden hour, warm low sunlight and long soft shadows.
Reference images: image 1 is the bride, photo 1 (face reference); image 2 is …
Keep the bride's and groom's faces, skin tone, hair and body shape exactly as in their reference photos. …
Moment: a medium shot of the bride and groom facing each other at the mandap, exchanging flower garlands (varmala).
Venue: the real venue shown in image 5. Keep its architecture, layout, floor and surroundings; only add the wedding décor.
Décor: a mandap with a carved dome canopy on four pillars; traditional décor in deep red and marigold gold …
The bride wears a deep red bridal lehenga … The groom wears an ivory sherwani …
Image 6 is from the same wedding: match its décor, colours, flowers, outfits and lighting exactly, from this new camera angle.
Style: natural professional wedding photography, flattering light true to the time of day, realistic skin texture … 16:9 landscape. No text, no watermark …
```

The tradition (`TRADITIONS`) and ceremony time (`CEREMONY_TIMES`) are part of every prompt, and the tradition also decides which six moments are drawn. Each part comes from the `prompt` field of a catalog entry, so wording for a specific option is edited in `src/config/catalog.ts`, and the overall structure in `prompts.ts`. `tests/prompts.test.ts` checks the structure; run `npm test` after editing.

The prompt actually used for every shot is saved in `shots.prompt`, which helps when tuning: open `npm run db:studio` and compare prompts with results.

## Cost

| Call | Price (USD) | ≈ ₹ at 88 | Source |
| --- | --- | --- | --- |
| One picture | $0.0398 | ₹3.50 | fal.ai Nano Banana Edit model page |
| One 720p clip | $0.10 | ₹8.80 | fal.ai Wan 2.2 Turbo model page |
| Venue depth | ≈ $0 (billed per compute second) | ≈ ₹0 | fal.ai Depth Anything V2 model page |
| **Full couple preview** (12 pictures + 3 clips) | ≈ $0.78 | **≈ ₹68** | |

On `AI_PROVIDER=cloudflare` every call costs ₹0 within the daily free allowance; the Shots step shows an estimate of pictures left today (`CLOUDFLARE_FREE` in `pricing.ts`). When the allowance runs out the shot fails with “resets at 5:30 am IST” and is not retried.

Prices are in `src/config/pricing.ts` and were checked in November 2026. Every call writes a `usage_events` row with its cost, so the admin page always shows actual spend. When fal.ai changes prices, update `pricing.ts`.

## Changing a model

1. Find the model on fal.ai and open its API tab to see its input fields.
2. Change the ID in `providers/fal/models.ts`.
3. If its inputs differ, adjust the object passed to `run()` in `providers/fal/index.ts`. If its output shape differs, adjust the matching `z.object(...)` schema in the same file.
4. Update `pricing.ts`.
5. Try it with `AI_PROVIDER=fal` on a test project.

Good candidates to compare for pictures: FLUX.1 Kontext multi-image, Seedream edit models, Gemini image models. Compare face likeness across six shots, not single-image beauty.

## Adding another provider

Create `src/server/ai/providers/<name>/index.ts` exporting an object that implements `AiProvider`, then add it to `getAiProvider()` in `src/server/ai/index.ts` and to the `AI_PROVIDER` enum in `src/server/env.ts`. Providers receive bytes and return bytes. They never touch the database or disk, so a self-hosted GPU service (for example a Python ComfyUI or diffusers server running PuLID + ControlNet) can be plugged in the same way.

## Demo provider

`providers/mock` makes the whole app usable with no account and no cost:

- **Pictures:** a storyboard sketch (`mock/storyboard.ts`) drawn from the catalog colours, with the couple's uploaded faces on the figures and the uploaded venue photo as the backdrop.
- **Depth:** a blurred greyscale stand-in, labelled as such on screen.
- **Clips:** no file. The screen animates the still with the chosen camera move.

Tests always use the demo provider, so they need no network.

## Features that need no AI service

These run in the browser (or on the app's own server), so they work and cost nothing on every setting:

| Feature | Code | How |
| --- | --- | --- |
| Our wedding film | `src/components/studio/film/` | Canvas animation of the drawn shots (slow pan and zoom, cross-fades, title cards), a tanpura drone synthesised with the Web Audio API, recorded to WebM/MP4 with `MediaRecorder` |
| Before / after | `src/components/studio/BeforeAfter.tsx` | The venue photo clipped over the drawn shot, driven by a range input |
| Save-the-date card | `src/components/studio/share/` | Canvas drawing at 1080 × 1350, PNG download or the Web Share API |
| Family votes | `src/server/services/share.ts`, `src/app/share/[token]` | A secret share link, one ♥ per person per shot, counts on the studio filmstrip |

## Known limits of this MVP (and the next steps)

| Limit | Why | Next step |
| --- | --- | --- |
| No automatic face-likeness score | The MVP relies on the model plus the anchor reference | Add a face-embedding check (e.g. an ArcFace model on fal or a small Python service) and auto-redraw shots below a threshold |
| Two people's identities in one image can occasionally blend | Multi-image models keep identity well but not perfectly | Per-couple LoRA training for premium tiers; or generate each person with PuLID and composite |
| Depth map is shown but not yet fed into generation | Nano Banana Edit takes images and text, not control maps | Switch shot generation to a FLUX + depth ControlNet pipeline when layout precision matters more than speed |
| Areas (segmentation) view from the prototype is not in the MVP | SAM 2 needs point or box prompts per surface | Add text-prompted segmentation and use masks for targeted décor edits |
| Clips are 5 s, 720p | Cost and speed trade-off | Offer 1080p or longer clips as a paid upgrade |
