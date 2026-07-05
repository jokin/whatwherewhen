import { camps } from "./data";
import { DAYS, DAY_DATES } from "./ds";

export function fmtTime(t: string): string {
  return !t || t === "00:00" ? "all day" : t;
}

export function timeToMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minsToHHMM(mins: number): string {
  const clamped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

export function getRealNowMins(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Returns festival day short name ("Tue"…"Sun") if today is during the festival, else null.
export function getFestivalDay(): string | null {
  const now = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const entry = Object.entries(DAY_DATES).find(([, v]) => v.replace(" ", "-0") === mmdd || v === mmdd.replace("0", " ").trimStart());
  // DAY_DATES values are like "07 JUL" — match by converting to date
  const year = now.getFullYear();
  const isoDate = now.toISOString().slice(0, 10);
  const dateMap: Record<string, string> = {};
  const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  for (const day of DAYS) {
    const parts = DAY_DATES[day].split(" "); // e.g. ["07", "JUL"]
    const mo = monthNames.indexOf(parts[1]) + 1;
    const dt = parseInt(parts[0]);
    dateMap[`${year}-${String(mo).padStart(2,"0")}-${String(dt).padStart(2,"0")}`] = day;
  }
  return dateMap[isoDate] ?? null;
  void entry;
}

// ---- orbit ring roads: smooth closed loop through the camps in plan order ----
const ORBIT_ORDER = [
  "Garden of Joy", "Ran'Dome", "Desert Dessert", "Barrio Espace", "Glowy Owl", "EYAO", "Glitch",
  "Curious Creatures", "ÜBERFIASCO", "JamHouse", "Mirage", "Oasis Playground", "Planet Pulpo", "Olive Odyssey",
  "Bread & Tomato", "Here & Meow", "sssh!", "Come & Play", "Peach Please", "Herding Cats", "Werkhaüs",
  "Mercurial Retrogrades", "Le Gratin", "Pink poney paradise", "NoBarrio", "Dusty Dreamers", "Jugaton",
  "Camp Cambio", "Barrio del Sol",
];

type Pt = [number, number];

// closed catmull-rom -> cubic bezier path through points [[x,y],...]
function catmull(pts: Pt[]): string {
  const n = pts.length;
  let d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1) + " ";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += "C " + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + ", " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) + ", " + p2[0].toFixed(1) + " " + p2[1].toFixed(1) + " ";
  }
  return d + "Z";
}

// orbit path in 0-100 viewBox coords; yScale/yOff match the renderers' Y transform;
// inflate scales the loop outward from its centroid (1 = through camps, 1.18 = perimeter road)
export function orbitD(yScale = 0.74, yOff = 7, inflate = 1): string {
  const byName = Object.fromEntries(camps.map((c) => [c.name, c]));
  const raw: Pt[] = ORBIT_ORDER.map((n) => byName[n]).filter(Boolean)
    .map((c) => [c.x, c.y * yScale + yOff]);
  const cx = raw.reduce((s, p) => s + p[0], 0) / raw.length;
  const cy = raw.reduce((s, p) => s + p[1], 0) / raw.length;
  const pts: Pt[] = raw.map((p) => [cx + (p[0] - cx) * inflate, cy + (p[1] - cy) * inflate]);
  return catmull(pts);
}
