/**
 * fal.ai model IDs used by the real pipeline.
 * To try a different model, change the ID here and adjust the input in
 * ./index.ts if that model takes different parameters.
 * Model pages: https://fal.ai/models/<id>
 */
export const FAL_MODELS = {
  /** Multi-image editing: couple photos + venue + outfits → one wedding picture. */
  image: "fal-ai/nano-banana/edit",
  /** Depth map from the venue photo. */
  depth: "fal-ai/image-preprocessors/depth-anything/v2",
  /** Image-to-video, 5 s clips. */
  video: "fal-ai/wan/v2.2-a14b/image-to-video/turbo",
} as const;
