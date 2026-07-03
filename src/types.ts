export interface Event {
  id: string;
  title: string;
  camp: string;
  loc: string;
  desc: string;
  time: string;       // "HH:MM" 24h, "00:00" = all day
  dur: number;        // minutes, 0 if unknown
  cat: string;
  days: string[];
  recur: boolean;
  host: string;       // optional host of the event, may be empty
}

export interface Camp {
  name: string;
  count: number;
  x: number;          // 0–100 map space
  y: number;          // 0–100 map space
}

export type TabName = "Browse" | "Map" | "Mine";
