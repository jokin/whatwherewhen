// Shared design-system components, ported from the B1 prototype.
import React, { useState, useEffect, useRef, ReactNode, CSSProperties } from "react";
import { DS, NOISE, DAYS, DAY_FULL, CATS, catOf } from "../ds";
import { minsToHHMM } from "../helpers";
import type { Event } from "../types";

// Collage "ransom-note" word — mixed-font cut-out chips, jittered & shadowed.
export function Ransom({ word, size, jitter }: { word: string; size: number; jitter?: number }) {
  const serif = "Georgia, 'Times New Roman', serif";
  const CUTS: Array<CSSProperties & { pad: string; bg: string; fg: string }> = [
    { fontFamily: DS.fDisp, bg: DS.hi, fg: DS.paper, border: "none", pad: "1px 4px" },
    { fontFamily: serif, bg: "#f4eedd", fg: DS.ink, border: "1px solid rgba(38,48,42,0.25)", fontStyle: "italic", pad: "1px 5px" },
    { fontFamily: DS.fDisp, bg: "#f4eedd", fg: DS.hi, border: "1px solid rgba(38,48,42,0.2)", pad: "1px 4px" },
    { fontFamily: DS.fMono, bg: DS.ink, fg: DS.paper, border: "none", fontWeight: 700, pad: "1px 5px" },
    { fontFamily: DS.fDisp, bg: "#dccfae", fg: DS.ink, border: "none", pad: "1px 4px" },
  ];
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
      {word.split("").map((ch, i) => {
        const c = CUTS[(i + (jitter || 0)) % CUTS.length];
        return (
          <span key={i} style={{ fontFamily: c.fontFamily, fontStyle: c.fontStyle, fontWeight: c.fontWeight,
            background: c.bg, color: c.fg, border: c.border, padding: c.pad,
            fontSize: size, lineHeight: 1, display: "inline-block",
            transform: "rotate(" + (((i % 3) - 1) * 2.5) + "deg) translateY(" + ((i % 2) ? 1 : -1.5) + "px)",
            boxShadow: "0 1px 2px rgba(38,48,42,0.25)" }}>{ch}</span>
        );
      })}
    </span>
  );
}

export function Phone({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", background: DS.paper, color: DS.ink,
      fontFamily: DS.fUi, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      backgroundImage: NOISE, backgroundSize: "140px 140px" }}>
      {children}
    </div>
  );
}

export function StatusBar() {
  const [t, setT] = useState(() => new Date().toTimeString().slice(0, 5));
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toTimeString().slice(0, 5)), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ height: 30, display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0 18px 0 50px", fontFamily: DS.fUi, fontSize: 13.6, color: DS.ink, flex: "0 0 auto", zIndex: 2 }}>
      <span style={{ fontWeight: 700 }}>{t}</span>
      <span style={{ color: DS.muted, whiteSpace: "nowrap" }}>no signal ✶ dusty</span>
    </div>
  );
}

export function AdmitStrip() {
  return (
    <div style={{ position: "absolute", left: 0, top: 30, bottom: "calc(62px + env(safe-area-inset-bottom))", width: 34, zIndex: 3,
      borderRight: "2px dotted rgba(38,48,42,0.45)", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between", padding: "14px 0 12px",
      background: "color-mix(in srgb,#2e4439 12%,transparent)" }}>
      <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: DS.fDisp,
        fontSize: 12.4, letterSpacing: 3, color: DS.hi }}>ADMIT ONE ✶ ELSEWHERE '26</span>
      <div style={{ width: 12, height: 56, background: "repeating-linear-gradient(0deg,#26302a 0 2px,transparent 2px 5px,#26302a 5px 6px,transparent 6px 10px)" }}></div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{ padding: "4px 18px 6px 50px", flex: "0 0 auto", zIndex: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, background: DS.card,
        border: "1.5px solid rgba(38,48,42,0.5)", borderRadius: 3, padding: "9px 12px",
        boxShadow: "1px 2px 0 rgba(38,48,42,0.18)" }} onClick={() => ref.current?.focus()}>
        <span style={{ fontWeight: 700, fontSize: 15.8 }}>⌕</span>
        <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "find happenings, camps…"}
          aria-label={placeholder || "find happenings, camps"}
          style={{ flex: 1, border: "none", background: "transparent", fontFamily: DS.fUi,
            fontSize: 14.7, color: DS.ink, outline: "none" }} />
        {value && <button onClick={() => onChange("")} aria-label="Clear search"
          style={{ cursor: "pointer", color: DS.muted, fontSize: 18.1, background: "none", border: "none", padding: 0, lineHeight: 1 }}>×</button>}
      </div>
    </div>
  );
}

export function DayTabs({ active, onChange }: { active: string; onChange: (d: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 5, padding: "4px 18px 4px 50px", flex: "0 0 auto", zIndex: 2 }}>
      {DAYS.map((d) => (
        <button key={d} onClick={() => onChange(d)} aria-pressed={d === active}
          style={{ flex: 1, textAlign: "center",
          fontFamily: DS.fUi, fontSize: 13.6, fontWeight: 700, padding: "5px 0 4px", borderRadius: 3,
          cursor: "pointer", userSelect: "none",
          border: d === active ? "2px solid " + DS.accent : "1.5px solid rgba(38,48,42,0.35)",
          color: d === active ? DS.paper : DS.ink,
          background: d === active ? DS.accent : "transparent",
          transform: d === active ? "rotate(-2deg)" : "none" }}>{d.toUpperCase()}</button>
      ))}
    </div>
  );
}

export function CatChips({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 });
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = () => {
    const el = ref.current; if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  };
  useEffect(() => {
    const el = ref.current; if (!el) return;
    updateEdges();
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!delta) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((delta < 0 && el.scrollLeft > 0) || (delta > 0 && el.scrollLeft < max)) e.preventDefault();
      el.scrollLeft += delta; updateEdges();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null;
    ro && ro.observe(el);
    return () => { el.removeEventListener("wheel", onWheel); ro && ro.disconnect(); };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    const el = ref.current; if (!el) return;
    drag.current = { down: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d.down) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) {
      if (!d.moved) { const el = ref.current; el?.setPointerCapture && el.setPointerCapture(e.pointerId); }
      d.moved = true;
    }
    ref.current!.scrollLeft = d.startLeft - dx;
    updateEdges();
  };
  const onUp = () => { drag.current.down = false; };
  const click = (key: string) => () => { if (drag.current.moved) return; onChange(key); };
  const scrollBy = (dir: number) => () => { const el = ref.current; if (el) { el.scrollLeft += dir * 160; updateEdges(); } };

  const fade = (side: "left" | "right"): CSSProperties => ({ position: "absolute", top: 0, bottom: 0,
    [side]: side === "left" ? 48 : 0, width: 34,
    pointerEvents: "none", zIndex: 4,
    background: "linear-gradient(to " + (side === "left" ? "right" : "left") + ", " + DS.paper + " 30%, " + DS.paper + "00)" });

  return (
    <div style={{ position: "relative", flex: "0 0 auto", zIndex: 2 }}>
      <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ display: "flex", gap: 7, padding: "6px 18px 8px 50px",
          overflowX: "auto", scrollbarWidth: "none", cursor: "grab", touchAction: "pan-x" }}>
        {CATS.map((c) => {
          const on = c.key === active;
          const cc = c.c || DS.accent;
          return (
            <button key={c.key} onClick={click(on ? "" : c.key)} aria-pressed={on}
              style={{ whiteSpace: "nowrap",
              flex: "0 0 auto", cursor: "pointer", userSelect: "none",
              fontFamily: DS.fUi, fontSize: 12.4, fontWeight: 700, padding: "5px 10px", borderRadius: 2,
              background: on ? cc : DS.card,
              color: on ? DS.paper : DS.ink,
              border: on ? "none" : "1px solid " + cc + "66",
              boxShadow: on ? "none" : "1px 1px 0 rgba(38,48,42,0.1)" }}>
              <span aria-hidden="true" style={{ color: on ? DS.paper : cc, marginRight: 4 }}>{c.glyph}</span>{c.label}
            </button>
          );
        })}
      </div>
      {edges.left && <div style={fade("left")}></div>}
      {edges.right && (
        <>
          <div style={fade("right")}></div>
          <button onClick={scrollBy(1)} aria-label="Scroll categories right"
            style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-60%)",
            zIndex: 5, cursor: "pointer", width: 22, height: 22, borderRadius: "50%", background: DS.card,
            border: "1px solid " + DS.ink + "55", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: DS.fUi, fontSize: 14, fontWeight: 700, color: DS.ink, boxShadow: "0 1px 2px rgba(38,48,42,0.2)",
            padding: 0 }}>›</button>
        </>
      )}
    </div>
  );
}

export function NowStrip({ events, onSelect }: { events: Event[]; onSelect: (e: Event) => void }) {
  const now = events.filter((e) => e.recur).slice(0, 2);
  if (!now.length) return null;
  return (
    <div style={{ margin: "6px 18px 2px 50px", flex: "0 0 auto", zIndex: 2 }}>
      {now.map((e, i) => (
        <button key={e.id} onClick={() => onSelect(e)} aria-label={"Now: " + e.title}
          style={{ cursor: "pointer", width: "100%",
          background: i === 0 ? DS.accent : DS.hi, color: DS.paper,
          padding: "8px 12px", marginBottom: i === 0 && now.length > 1 ? 4 : 0,
          display: "flex", alignItems: "center", gap: 10, border: "none", textAlign: "left", fontFamily: "inherit" }}>
          <span style={{ fontFamily: DS.fDisp, fontSize: 12.4, letterSpacing: 1, whiteSpace: "nowrap" }}>● NOW</span>
          <span style={{ fontFamily: DS.fDisp, fontSize: 17, lineHeight: 1, flex: 1, minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title.toUpperCase()}</span>
          <span style={{ fontFamily: DS.fUi, fontSize: 11.3, whiteSpace: "nowrap", opacity: 0.85 }}>{e.camp}</span>
        </button>
      ))}
    </div>
  );
}

export function StubCard({ event, saved, onSelect, onSave, index }: {
  event: Event; saved: boolean; onSelect: (e: Event) => void; onSave: (id: string) => void; index: number;
}) {
  const cat = catOf(event.cat);
  const acc = cat.c || (index % 2 === 0 ? DS.accent : DS.hi);
  const t = event.time === "00:00" ? "✶" : event.time;
  return (
    <div onClick={() => onSelect(event)}
      role="button" tabIndex={0} aria-label={event.title}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(event); } }}
      style={{ display: "flex", background: DS.card,
      border: "1px solid rgba(38,48,42,0.25)", boxShadow: "1px 2px 0 rgba(38,48,42,0.14)",
      borderLeft: "5px solid " + acc, cursor: "pointer", position: "relative",
      transform: "rotate(" + (index % 2 ? 0.4 : -0.4) + "deg)" }}>
      <div style={{ flex: "0 0 52px", borderRight: "2px dotted rgba(38,48,42,0.35)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2, padding: "9px 0" }}>
        <span style={{ fontFamily: DS.fDisp, fontSize: 17, color: acc, lineHeight: 1 }}>{t}</span>
        {event.dur > 0 && <span style={{ fontFamily: DS.fMono, fontSize: 10.2, color: DS.muted }}>{event.dur}m</span>}
      </div>
      <div style={{ flex: "1 1 auto", minWidth: 0, padding: "8px 10px 8px 10px" }}>
        <div style={{ fontFamily: DS.fUi, fontWeight: 700, fontSize: 14.7, lineHeight: 1.25, color: DS.ink,
          paddingRight: 74,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{event.title}</div>
        <div style={{ fontFamily: DS.fUi, fontSize: 12.4, color: DS.brown, marginTop: 2 }}>@ {event.camp}{event.loc ? " · " + event.loc : ""}</div>
        <div style={{ fontFamily: DS.fMono, fontSize: 11.3, color: DS.muted, lineHeight: 1.3, marginTop: 3,
          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{event.desc}</div>
      </div>
      <span style={{ position: "absolute", right: 7, top: 5, transform: "rotate(" + (index % 2 ? -4 : 4) + "deg)",
        background: acc, color: DS.paper, fontFamily: DS.fUi, fontSize: 9, fontWeight: 700,
        letterSpacing: 1, padding: "2px 5px", borderRadius: 2 }}>{cat.label.toUpperCase()}</span>
      <button onClick={(ev) => { ev.stopPropagation(); onSave(event.id); }}
        aria-label={saved ? "Remove from saved" : "Save event"}
        aria-pressed={saved}
        style={{ position: "absolute", right: 6, bottom: 5, fontSize: 15.8, cursor: "pointer",
          color: saved ? DS.accent : DS.muted, background: "none", border: "none", padding: 0, lineHeight: 1 }}>
        {saved ? "♥" : "♡"}
      </button>
    </div>
  );
}

export function TimeSlider({ mins, onChange, onReset, isRealNow }: {
  mins: number; onChange: (m: number) => void; onReset: () => void; isRealNow: boolean;
}) {
  return (
    <div style={{ flex: "0 0 auto", padding: "5px 18px 7px 50px",
      background: DS.card, borderBottom: "1.5px dotted rgba(38,48,42,0.4)",
      display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontFamily: DS.fDisp, fontSize: 16, lineHeight: 1, minWidth: 60,
        color: isRealNow ? DS.accent : DS.hi, whiteSpace: "nowrap" }}>
        {isRealNow ? "● NOW" : "⏲ " + minsToHHMM(mins)}
      </span>
      <input type="range" min={0} max={1439} value={mins}
        aria-label="Time travel slider"
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: DS.accent, cursor: "pointer", height: 4 }} />
      {!isRealNow && (
        <button onClick={onReset} aria-label="Back to now"
          style={{ flex: "0 0 auto", cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: DS.fUi, fontSize: 11, fontWeight: 700, color: DS.paper,
            background: DS.accent, border: "none", padding: "4px 8px", borderRadius: 2,
            letterSpacing: 0.5 }}>↩ NOW</button>
      )}
    </div>
  );
}

export function Nav({ active, onChange }: { active: string; onChange: (tab: "Browse" | "Map" | "Mine") => void }) {
  const tabs: Array<[string, "Browse" | "Map" | "Mine"]> = [["✶", "Browse"], ["◈", "Map"], ["♥", "Mine"]];
  return (
    <nav aria-label="Main navigation" style={{ display: "flex", borderTop: "2px dotted rgba(38,48,42,0.45)", flex: "0 0 auto",
      background: DS.card, zIndex: 10, position: "relative", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabs.map(([g, l]) => (
        <button key={l} onClick={() => onChange(l)} aria-current={l === active ? "page" : undefined}
          style={{ flex: 1, textAlign: "center", padding: "8px 0 12px",
          cursor: "pointer", background: l === active ? DS.hi : "transparent", color: l === active ? DS.paper : DS.muted,
          border: "none", fontFamily: DS.fUi }}>
          <div aria-hidden="true" style={{ fontSize: 18.1 }}>{g}</div>
          <div style={{ fontSize: 11.3, fontWeight: l === active ? 700 : 400 }}>{l}</div>
        </button>
      ))}
    </nav>
  );
}
