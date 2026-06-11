import raw from "./data/events.json";
import type { Event, Camp } from "./types";

export const events = raw.events as Event[];
export const camps = raw.camps as Camp[];
