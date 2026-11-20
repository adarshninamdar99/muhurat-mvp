# API reference

The screens use this JSON API; it can also be used by other A Lovers Card systems. All endpoints live under `/api`. Errors always look like:

```json
{ "error": "A message you can show the user." }
```

with status `400` (bad input), `404` (not found) or `500` (server problem).

Most write endpoints return the full **project state** (`ProjectState` in `src/lib/types.ts`), so the caller never needs a second request.

## Projects

### `POST /api/projects`
Start a preview.
```json
// request
{ "brideName": "Priya", "groomName": "Arjun" }
// 201 response
{ "id": "6f1c…" }
```

### `GET /api/projects`
The 20 most recently updated previews: `[{ id, brideName, groomName, updatedAt }]`.

### `GET /api/projects/:id`
The project state. The studio polls this every 1.5 s while work is running.

```jsonc
{
  "id": "6f1c…",
  "brideName": "Priya",
  "groomName": "Arjun",
  "selections": { "venueKey": "palace", "themeKey": "marigold", "flowerKey": "marigold", "mandapKey": "dome",
                  "lightKey": "fairy", "brideOutfitKey": "ruby", "groomOutfitKey": "ivory" },
  "venuePhotoUrl": "/api/files/projects/6f1c…/venue/….jpg",   // or null
  "venueDepthUrl": "/api/files/projects/6f1c…/venue/….png",   // or null
  "photos": [{ "id": "…", "person": "bride", "url": "/api/files/…" }],
  "shots": [{ "id": "…", "templateKey": "varmala", "status": "done", "url": "/api/files/…", "stale": false, "error": null, "updatedAt": 1763621000000 }],
  "clips": [{ "id": "…", "shotId": "…", "moveKey": "orbit", "status": "done", "url": null, "previewOnly": true, "error": null, "updatedAt": 1763621000000 }],
  "activeJobs": [{ "id": "…", "type": "generate_shot", "status": "running", "progress": "Drawing the picture", "error": null }],
  "spend": { "images": 7, "clips": 1, "inr": 33.4 },
  "prices": { "imageInr": 3.5, "clipInr": 8.8 },
  "provider": "fal"
}
```

`status` is one of `queued`, `running`, `done`, `failed`. `stale: true` means choices changed after the picture was made.

### `PATCH /api/projects/:id`
Change names or choices. Send any subset:
```json
{ "themeKey": "pastel", "flowerKey": "rose" }
```
Keys must exist in `src/config/catalog.ts`; unknown keys return `400`. Returns the project state.

## Photos

### `POST /api/projects/:id/photos`
`multipart/form-data` with `person` (`bride` | `groom`) and `file` (JPG, PNG or WebP, max 12 MB). Up to 5 per person. Returns the project state (`201`).

### `DELETE /api/projects/:id/photos/:photoId`
Returns the project state.

## Venue

### `POST /api/projects/:id/venue`
`multipart/form-data` with `file`. Replaces any previous venue photo and queues a depth-map job. Returns the project state (`201`).

### `DELETE /api/projects/:id/venue`
Removes the venue photo; the preset venue type is used again.

## Shots

### `POST /api/projects/:id/shots`
Draw or redraw shots.
```json
{ "templateKeys": ["entry", "varmala", "pheras", "portrait", "family", "reception"] }
```
If the anchor shot (`entry`) is not finished, or is in the list, it is drawn first and the others are queued after it. Returns the project state (`202`).

## Clips

### `POST /api/projects/:id/clips`
```json
{ "shotId": "…", "moveKey": "orbit" }
```
The shot must be `done`. Returns the project state (`202`). In demo mode the finished clip has `previewOnly: true` and no `url`.

## Quote

### `GET /api/projects/:id/quote`
```json
{ "lines": [{ "key": "mandap", "label": "Dome mandap", "detail": "Structure, fabric and set-up", "low": 51500, "high": 92000 }, …],
  "totalLow": 113000, "totalHigh": 195000 }
```

### `POST /api/projects/:id/quote`
Saves a vendor quote request for the current look: `{ "id": "…", "vendorCount": 3 }` (`201`).

## Files

### `GET /api/files/<path>`
Serves stored photos, pictures, depth maps and clips. Paths come from the URLs in the project state. Requests outside the storage folder return `404`.

## Health

### `GET /api/health`
`{ "ok": true, "provider": "fal" }`, for uptime monitoring.

## Access

Preview URLs contain a random ID and are not listed anywhere public, which is enough for a closed pilot. Before a public launch, add sign-in (for couples and planners) and check ownership in each route. The admin page (`/admin`) is protected by a password in `src/middleware.ts`.
