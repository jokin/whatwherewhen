import { useState, useEffect, useRef } from "react";
import { DS, catOf } from "../ds";
import type { Event } from "../types";

export function EventSheet({ event, saved, onClose, onSave }: {
  event: Event; saved: boolean; onClose: () => void; onSave: (id: string) => void;
}) {
  const [vis, setVis] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { requestAnimationFrame(() => { setVis(true); closeRef.current?.focus(); }); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 280); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!event) return null;
  const cat = catOf(event.cat);
  const cc = cat.c || DS.accent;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
      <div onClick={close} aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(38,48,42,0.45)",
        opacity: vis ? 1 : 0, transition: "opacity 0.28s" }}></div>
      <div role="dialog" aria-modal="true" aria-label={event.title}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "78%",
        background: DS.card, borderTop: "2px solid " + DS.ink,
        transform: vis ? "translateY(0)" : "translateY(100%)", transition: "transform 0.28s cubic-bezier(.2,.8,.3,1)",
        display: "flex", flexDirection: "column" }}>
        {/* drag handle */}
        <div style={{ flex: "0 0 auto", padding: "10px 18px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div aria-hidden="true" style={{ width: 40, height: 4, background: "rgba(38,48,42,0.3)", borderRadius: 2, margin: "0 auto 0 0" }}></div>
          <button ref={closeRef} onClick={close} aria-label="Close"
            style={{ fontSize: 24.9, cursor: "pointer", color: DS.muted, lineHeight: 1, background: "none", border: "none", padding: 0 }}>×</button>
        </div>
        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "0 18px 24px" }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <span style={{ background: cc, color: DS.paper, fontFamily: DS.fUi, fontSize: 10.2, fontWeight: 700,
              letterSpacing: 1, padding: "3px 8px", transform: "rotate(-2deg)", display: "inline-block" }}>
              {cat.glyph} {cat.label.toUpperCase()}
            </span>
            {event.recur && <span style={{ border: "1.5px dashed " + DS.brown, color: DS.brown,
              fontFamily: DS.fUi, fontSize: 10.2, padding: "3px 8px" }}>RECURRING</span>}
          </div>
          <div style={{ fontFamily: DS.fDisp, fontSize: 29.4, lineHeight: 1.0, color: DS.hi, marginBottom: 10 }}>{event.title.toUpperCase()}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: DS.fMono, fontSize: 10.2, letterSpacing: 1, color: DS.muted }}>TIME</div>
              <div style={{ fontFamily: DS.fDisp, fontSize: 24.9, color: cc }}>
                {event.time === "00:00" ? "All day" : event.time}
                {event.dur > 0 && <span style={{ fontSize: 14.7, color: DS.muted, marginLeft: 8 }}>{event.dur} min</span>}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: DS.fMono, fontSize: 10.2, letterSpacing: 1, color: DS.muted }}>DAYS</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
                {event.days.map((d) => (
                  <span key={d} style={{ fontFamily: DS.fUi, fontSize: 12.4, fontWeight: 700, padding: "2px 7px",
                    background: DS.hi, color: DS.paper, borderRadius: 2 }}>{d.toUpperCase()}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: DS.paper, border: "1px solid rgba(38,48,42,0.2)", padding: "10px 12px", marginBottom: 14 }}>
            <div style={{ fontFamily: DS.fMono, fontSize: 10.2, letterSpacing: 1, color: DS.muted, marginBottom: 4 }}>CAMP / VENUE</div>
            <div style={{ fontFamily: DS.fUi, fontSize: 15.8, fontWeight: 700, color: DS.ink }}>{event.camp}</div>
            {event.loc && <div style={{ fontFamily: DS.fUi, fontSize: 13.6, color: DS.brown, marginTop: 2 }}>{event.loc}</div>}
          </div>
          <div style={{ fontFamily: DS.fMono, fontSize: 14.7, lineHeight: 1.55, color: DS.ink }}>{event.desc}</div>
        </div>
        <div style={{ flex: "0 0 auto", padding: "12px 18px 20px", paddingBottom: "max(20px, calc(env(safe-area-inset-bottom) + 12px))", borderTop: "2px dotted rgba(38,48,42,0.35)",
          background: DS.card, display: "flex", gap: 12 }}>
          <button onClick={() => onSave(event.id)} style={{ flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, padding: "12px", cursor: "pointer",
            background: saved ? DS.accent : "transparent", color: saved ? DS.paper : DS.ink,
            border: "2px solid " + (saved ? DS.accent : DS.ink), fontFamily: DS.fUi, fontSize: 14.7, fontWeight: 700 }}>
            {saved ? "♥ Saved" : "♡ Save to Mine"}
          </button>
          <button onClick={close} style={{ flex: 1, padding: "12px", cursor: "pointer",
            background: DS.hi, color: DS.paper, border: "none",
            fontFamily: DS.fUi, fontSize: 14.7, fontWeight: 700 }}>Done</button>
        </div>
      </div>
    </div>
  );
}
