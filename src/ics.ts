// Client-side calendar export: .ics file build + Google Calendar URLs.
import { CAL_DATES } from "./ds";
import type { Event } from "./types";

function icsEsc(s: string): string {
  return (s || "").replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function calcTimes(event: Event, day: string): { dtStart: string; dtEnd: string } | null {
  const d = CAL_DATES[day];
  if (!d) return null;
  if (!event.time || event.time === "00:00")
    return { dtStart: "DTSTART;VALUE=DATE:" + d, dtEnd: "DTEND;VALUE=DATE:" + d };
  const [hh, mm] = event.time.split(":").map(Number);
  const ts = String(hh).padStart(2, "0") + String(mm).padStart(2, "0") + "00";
  const endM = hh * 60 + mm + (event.dur > 0 ? event.dur : 60);
  const te = String(Math.floor(endM / 60) % 24).padStart(2, "0") + String(endM % 60).padStart(2, "0") + "00";
  return { dtStart: "DTSTART:" + d + "T" + ts, dtEnd: "DTEND:" + d + "T" + te };
}

export function buildICS(events: Event[]): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Elsewhere '26//WWW//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Elsewhere '26 — My Schedule",
  ];
  for (const e of events) {
    for (const day of e.days) {
      const t = calcTimes(e, day);
      if (!t) continue;
      const loc = [e.camp, e.loc].filter(Boolean).join(" · ");
      lines.push("BEGIN:VEVENT");
      lines.push("UID:" + e.id + "-" + day + "@elsewhere26");
      lines.push("DTSTAMP:20260611T000000Z");
      lines.push(t.dtStart);
      lines.push(t.dtEnd);
      lines.push("SUMMARY:" + icsEsc(e.title));
      if (e.desc) lines.push("DESCRIPTION:" + icsEsc(e.desc));
      if (loc) lines.push("LOCATION:" + icsEsc(loc));
      lines.push("END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(events: Event[]): void {
  const blob = new Blob([buildICS(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "elsewhere-26-schedule.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function parseICS(text: string): { uid: string; summary: string }[] {
  const vevents: { uid: string; summary: string }[] = [];
  let inEvent = false, uid = "", summary = "";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "BEGIN:VEVENT") { inEvent = true; uid = ""; summary = ""; }
    else if (line === "END:VEVENT") { if (inEvent) vevents.push({ uid, summary }); inEvent = false; }
    else if (inEvent) {
      if (line.startsWith("UID:")) uid = line.slice(4);
      else if (line.startsWith("SUMMARY:"))
        summary = line.slice(8).replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
    }
  }
  return vevents;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

export function matchICSToEvents(parsed: { uid: string; summary: string }[], allEvents: Event[]): string[] {
  const ids = new Set<string>();
  for (const { uid, summary } of parsed) {
    // Our own export UID format: {id}-{day}@elsewhere26
    const m = uid.match(/^(.+)-(Tue|Wed|Thu|Fri|Sat|Sun)@elsewhere26$/);
    if (m) {
      const ev = allEvents.find((e) => e.id === m[1]);
      if (ev) { ids.add(ev.id); continue; }
    }
    // Fallback: normalised title match
    const ns = norm(summary);
    const ev = allEvents.find((e) => norm(e.title) === ns);
    if (ev) ids.add(ev.id);
  }
  return [...ids];
}

export function buildGCalUrl(event: Event, day?: string): string {
  const d = CAL_DATES[day || event.days[0]];
  if (!d) return "#";
  let dates: string;
  if (!event.time || event.time === "00:00") {
    dates = d + "/" + d;
  } else {
    const [hh, mm] = event.time.split(":").map(Number);
    const ts = String(hh).padStart(2, "0") + String(mm).padStart(2, "0") + "00";
    const endM = hh * 60 + mm + (event.dur > 0 ? event.dur : 60);
    const te = String(Math.floor(endM / 60) % 24).padStart(2, "0") + String(endM % 60).padStart(2, "0") + "00";
    dates = d + "T" + ts + "/" + d + "T" + te;
  }
  const loc = [event.camp, event.loc].filter(Boolean).join(" · ");
  return "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + encodeURIComponent(event.title)
    + "&dates=" + encodeURIComponent(dates)
    + "&details=" + encodeURIComponent(event.desc || "")
    + "&location=" + encodeURIComponent(loc);
}
