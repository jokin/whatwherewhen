// Design tokens for Elsewhere '26 — What Where When.

export const DS = {
  paper: "#e8dfc9",
  card: "#f1ead8",
  ink: "#26302a",
  accent: "#8a3b2a",
  hi: "#2e4439",
  brown: "#7a5236",
  muted: "#857a62",
  photo: "#51648a",
  fDisp: "'Anton', sans-serif",
  fUi: "'Special Elite','Courier Prime',monospace",
  fMono: "'Courier Prime',ui-monospace,monospace",
} as const;

export const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

export const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_FULL: Record<string, string> = {
  Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

export const DAY_DATES: Record<string, string> = {
  Tue: "07 JUL", Wed: "08 JUL", Thu: "09 JUL",
  Fri: "10 JUL", Sat: "11 JUL", Sun: "12 JUL",
};

export const CAL_DATES: Record<string, string> = {
  Tue: "20260707", Wed: "20260708", Thu: "20260709",
  Fri: "20260710", Sat: "20260711", Sun: "20260712",
};

export interface Cat {
  key: string;
  label: string;
  glyph: string;
  c: string;
}

export const CATS: Cat[] = [
  { key: "", label: "All", glyph: "✶", c: "#8a3b2a" },
  { key: "work", label: "Workshops", glyph: "✷", c: "#9a6a2c" },
  { key: "adult", label: "Adults", glyph: "✦", c: "#8c2f43" },
  { key: "party", label: "Parties", glyph: "◆", c: "#7d4a86" },
  { key: "heal", label: "Spiritual", glyph: "△", c: "#4d6a8a" },
  { key: "chill", label: "Chillout", glyph: "◠", c: "#2f7d74" },
  { key: "food", label: "Food", glyph: "♥", c: "#a8502b" },
  { key: "kids", label: "Kids", glyph: "☼", c: "#b07d12" },
  { key: "other", label: "Other", glyph: "●", c: "#6f5c43" },
];

export function catOf(key: string): Cat {
  return CATS.find((c) => c.key === key) || CATS[CATS.length - 1];
}

export function catColor(key: string): string {
  return catOf(key).c || DS.accent;
}
