import { useState, useEffect, useRef } from "react";
import { DS, DAYS, DAY_FULL, DAY_DATES, catColor } from "../ds";
import { downloadICS, buildGCalUrl } from "../ics";
import type { Event } from "../types";

export function CalendarExportSheet({ events, onClose }: { events: Event[]; onClose: () => void }) {
  const [vis, setVis] = useState(false);
  const [done, setDone] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { requestAnimationFrame(() => { setVis(true); closeRef.current?.focus(); }); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 280); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleDownload = () => {
    downloadICS(events);
    setDone(true);
    setTimeout(() => setDone(false), 3500);
  };

  const totalOcc = events.reduce((n, e) => n + e.days.length, 0);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
      <div onClick={close} aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(38,48,42,0.45)",
        opacity: vis ? 1 : 0, transition: "opacity 0.28s" }}></div>
      <div role="dialog" aria-modal="true" aria-label="Add to calendar"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "86%",
        background: DS.card, borderTop: "2px solid " + DS.ink,
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.28s cubic-bezier(.2,.8,.3,1)",
        display: "flex", flexDirection: "column" }}>

        {/* handle + close */}
        <div style={{ flex: "0 0 auto", padding: "10px 18px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div aria-hidden="true" style={{ width: 40, height: 4, background: "rgba(38,48,42,0.3)", borderRadius: 2 }}></div>
          <button ref={closeRef} onClick={close} aria-label="Close"
            style={{ fontSize: 24, cursor: "pointer", color: DS.muted, lineHeight: 1, background: "none", border: "none", padding: 0 }}>×</button>
        </div>

        {/* heading */}
        <div style={{ flex: "0 0 auto", padding: "6px 18px 12px" }}>
          <div style={{ fontFamily: DS.fMono, fontSize: 10, letterSpacing: 1.5, color: DS.brown }}>ADD TO CALENDAR</div>
          <div style={{ fontFamily: DS.fDisp, fontSize: 27, lineHeight: 1, color: DS.hi, marginTop: 3 }}>MY SCHEDULE</div>
          <div style={{ fontFamily: DS.fUi, fontSize: 12, color: DS.muted, marginTop: 4 }}>
            {events.length} saved{totalOcc > events.length ? " · " + totalOcc + " occurrences" : ""}
          </div>
        </div>

        {/* scrollable body */}
        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "0 18px 32px" }}>

          {/* ── Primary: ICS download ── */}
          <button onClick={handleDownload} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "14px 14px",
            background: done ? DS.accent : DS.hi, color: DS.paper,
            border: "none", cursor: "pointer", textAlign: "left",
            transition: "background 0.25s", marginBottom: 5 }}>
            <div style={{ flex: "0 0 auto", width: 38, height: 38,
              border: "2px solid rgba(232,223,201,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: DS.fDisp, fontSize: 22, color: DS.paper }}>
              {done ? "✶" : "↓"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: DS.fUi, fontSize: 15, fontWeight: 700 }}>
                {done ? "Downloaded! Open to import" : "Download .ics file"}
              </div>
              <div style={{ fontFamily: DS.fMono, fontSize: 9.5, color: "rgba(232,223,201,0.65)", marginTop: 2 }}>
                all {events.length} events in one file
              </div>
            </div>
          </button>
          <div style={{ background: DS.paper, border: "1px solid rgba(38,48,42,0.15)",
            padding: "8px 10px", marginBottom: 20,
            fontFamily: DS.fMono, fontSize: 9.5, color: DS.muted, lineHeight: 1.65 }}>
            <span style={{ color: DS.ink, fontWeight: 700 }}>iOS</span> → opens in Apple Calendar &nbsp;✶&nbsp;
            <span style={{ color: DS.ink, fontWeight: 700 }}>Android</span> → opens in Google Calendar &nbsp;✶&nbsp;
            <span style={{ color: DS.ink, fontWeight: 700 }}>Desktop</span> → double-click to import
          </div>

          {/* ── Divider ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, borderTop: "2px dotted rgba(38,48,42,0.3)" }}></div>
            <span style={{ fontFamily: DS.fMono, fontSize: 9, letterSpacing: 1.5, color: DS.muted, flex: "0 0 auto" }}>
              OR ADD ONE BY ONE TO GOOGLE CALENDAR
            </span>
            <div style={{ flex: 1, borderTop: "2px dotted rgba(38,48,42,0.3)" }}></div>
          </div>
          <div style={{ fontFamily: DS.fMono, fontSize: 9.5, color: DS.muted, marginBottom: 14, lineHeight: 1.5 }}>
            Tap any event to open it directly in Google Calendar.
          </div>

          {/* ── Per-day event list ── */}
          {DAYS.filter((d) => events.some((e) => e.days.includes(d))).map((day) => {
            const dayEvs = events
              .filter((e) => e.days.includes(day))
              .sort((a, b) => {
                const ta = (!a.time || a.time === "00:00") ? "99:99" : a.time;
                const tb = (!b.time || b.time === "00:00") ? "99:99" : b.time;
                return ta.localeCompare(tb);
              });
            return (
              <div key={day} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8,
                  borderBottom: "2px solid " + DS.ink, paddingBottom: 4, marginBottom: 7 }}>
                  <span style={{ fontFamily: DS.fDisp, fontSize: 15, color: DS.hi }}>
                    {DAY_FULL[day].toUpperCase()}
                  </span>
                  <span style={{ fontFamily: DS.fMono, fontSize: 9.5, color: DS.brown, letterSpacing: 0.5 }}>
                    ✶ {DAY_DATES[day]}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {dayEvs.map((e) => (
                    <a key={e.id} href={buildGCalUrl(e, day)} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 8,
                        background: DS.paper, border: "1px solid rgba(38,48,42,0.18)",
                        padding: "7px 9px", textDecoration: "none", color: "inherit" }}>
                      <span style={{ fontFamily: DS.fDisp, fontSize: 13, color: catColor(e.cat),
                        flex: "0 0 38px", lineHeight: 1 }}>
                        {(!e.time || e.time === "00:00") ? "✶" : e.time}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: DS.fUi, fontWeight: 700, fontSize: 12.5, color: DS.ink,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                        <div style={{ fontFamily: DS.fMono, fontSize: 9.5, color: DS.muted }}>{e.camp}</div>
                      </div>
                      <span style={{ flex: "0 0 auto", fontFamily: DS.fUi, fontSize: 9.5, fontWeight: 700,
                        color: DS.paper, background: DS.accent, padding: "3px 7px", whiteSpace: "nowrap" }}>
                        + GCal ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
