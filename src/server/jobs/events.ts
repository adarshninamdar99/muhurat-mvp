import { EventEmitter } from "node:events";

/**
 * Tiny signal so code that adds a job can wake the worker without importing it
 * (which would create a circular import: worker → handlers → services → queue).
 */
const globalForEvents = globalThis as unknown as { __muhuratJobEvents?: EventEmitter };
export const jobEvents: EventEmitter = globalForEvents.__muhuratJobEvents ?? new EventEmitter();
globalForEvents.__muhuratJobEvents = jobEvents;

export const JOB_ADDED = "job-added";
