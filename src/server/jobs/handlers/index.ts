import type { JobType } from "../queue";
import type { JobHandler } from "../types";
import { analyzeVenue } from "./analyzeVenue";
import { generateClip } from "./generateClip";
import { generateShot } from "./generateShot";

/** Maps each job type to the code that runs it. Add new job types here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handlers: Record<JobType, JobHandler<any>> = {
  analyze_venue: analyzeVenue,
  generate_shot: generateShot,
  generate_clip: generateClip,
};
