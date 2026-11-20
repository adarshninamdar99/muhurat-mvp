# Outfit catalogue photos

Put A Lovers Card product photos here (JPG, PNG or WebP), for example `red-lehenga.jpg`.

Then point the outfit at it in `src/config/catalog.ts`:

```ts
{ key: "ruby", name: "Red lehenga", referenceImage: "/catalog/outfits/red-lehenga.jpg", productUrl: "https://…", … }
```

The photo is sent to the AI with every shot, so the outfit in the pictures matches the real product.
Use a clear photo of the outfit alone, on a plain background if possible.
