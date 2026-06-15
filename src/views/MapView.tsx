import { useState, useMemo, useRef, useEffect, Fragment } from "react";
import { DS, DAYS, DAY_FULL, DAY_DATES, catOf, catColor } from "../ds";
import { events, camps } from "../data";
import { fmtTime, orbitD } from "../helpers";
import { Phone, StatusBar, AdmitStrip, SearchInput, Nav } from "../components/ui";
import { EventSheet } from "../sheets/EventSheet";
import type { Event, Camp, TabName } from "../types";

const od1 = orbitD(0.74, 7, 1.18);
const od2 = orbitD(0.74, 7, 1);

export function MapView({ saved, onSave, onTabChange }: {
  saved: Set<string>; onSave: (id: string) => void; onTabChange: (t: TabName) => void;
}) {
  const [query, setQuery] = useState("");
  const [selCamp, setSelCamp] = useState<Camp | null>(null);
  const [sheet, setSheet] = useState<Event | null>(null);

  const filteredCamps = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return camps;
    return camps.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const campEvents = useMemo(() => {
    if (!selCamp) return [];
    return events.filter((e) => e.camp === selCamp.name)
      .sort((a, b) => {
        const da = DAYS.indexOf(a.days[0] as typeof DAYS[number]) * 100 + parseInt(a.time || "99", 10);
        const db = DAYS.indexOf(b.days[0] as typeof DAYS[number]) * 100 + parseInt(b.time || "99", 10);
        return da - db;
      });
  }, [selCamp]);

  // Escape closes the camp panel (the event sheet handles its own Escape first)
  const sheetRef = useRef(sheet); sheetRef.current = sheet;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !sheetRef.current) setSelCamp(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Y = (y: number) => y * 0.74 + 7;

  return (
    <Phone>
      <StatusBar />
      <AdmitStrip />
      <div style={{ padding: "2px 18px 6px 50px", flex: "0 0 auto", zIndex: 2 }}>
        <div style={{ fontFamily: DS.fDisp, fontSize: 29.4, lineHeight: 0.95, color: DS.hi }}>THE CITY</div>
        <div style={{ fontFamily: DS.fUi, fontSize: 12.4, color: DS.brown }}>37 barrios · tap a camp</div>
      </div>
      <SearchInput value={query} onChange={setQuery} placeholder="search a barrio…" />
      {/* map */}
      <div onClick={() => setSelCamp(null)} style={{ flex: "1 1 auto", position: "relative", overflow: "hidden", background: DS.paper }}>
        <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={od1} fill="none" stroke={DS.brown} strokeOpacity="0.55" strokeWidth="2.5"
            strokeDasharray="7 5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          <path d={od2} fill="rgba(220,207,174,0.4)" stroke={DS.ink} strokeOpacity="0.4" strokeWidth="1.5"
            strokeDasharray="2 4" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          <path d="M 86 71 C 92 74, 95 80, 97 88" fill="none" stroke={DS.brown} strokeOpacity="0.5" strokeWidth="2.5"
            strokeDasharray="7 5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>
        {/* burn */}
        <div style={{ position: "absolute", left: "46%", top: Y(46) + "%", transform: "translate(-50%,-50%) rotate(-6deg)", zIndex: 4, textAlign: "center" }}>
          <div style={{ border: "2.5px solid " + DS.accent, color: DS.accent, borderRadius: "50%", width: 50, height: 50,
            background: "color-mix(in srgb," + DS.accent + " 10%,transparent)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14.7 }}>✶</span>
            <span style={{ fontFamily: DS.fUi, fontSize: 7.9, fontWeight: 700, letterSpacing: 0.5 }}>THE BURN</span>
          </div>
        </div>
        {/* GATE */}
        <div style={{ position: "absolute", right: 8, bottom: 40, transform: "rotate(5deg)", zIndex: 4,
          border: "2px solid " + DS.hi, color: DS.hi, fontFamily: DS.fUi, fontSize: 10.2, fontWeight: 700,
          padding: "2px 6px", borderRadius: 3 }}>GATE ⟶</div>
        {/* camps */}
        {filteredCamps.map((c, i) => {
          const big = c.count >= 16;
          const sel = selCamp?.name === c.name;
          return (
            <button key={c.name} onClick={(ev) => { ev.stopPropagation(); setSelCamp(sel ? null : c); }}
              aria-pressed={sel} aria-label={c.name}
              style={{ position: "absolute", left: c.x + "%", top: Y(c.y) + "%",
                transform: "translate(-50%,-50%) rotate(" + ((i % 3 - 1) * 3) + "deg)", zIndex: big ? 5 : 3, cursor: "pointer",
                background: "none", border: "none", padding: 0 }}>
              {big ? (
                <span style={{ display: "inline-block", background: sel ? DS.accent : DS.card,
                  color: sel ? DS.paper : DS.ink,
                  border: "1px solid rgba(38,48,42," + (sel ? "0.0" : "0.4") + ")",
                  fontFamily: DS.fUi, fontSize: 9.6, fontWeight: 700, padding: "2px 5px",
                  boxShadow: "1px 1px 0 rgba(38,48,42,0.2)", whiteSpace: "nowrap",
                  transform: sel ? "scale(1.1)" : "none" }}>{c.name}</span>
              ) : (
                <span style={{ display: "block", width: 7, height: 7, borderRadius: "50%",
                  background: sel ? DS.accent : DS.brown,
                  border: "1.5px solid " + DS.paper, boxShadow: "0 0 0 1px " + DS.brown }}></span>
              )}
            </button>
          );
        })}
        {/* Camp bottom panel */}
        {selCamp && (
          <div onClick={(ev) => ev.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "48%",
            background: DS.card, borderTop: "2px solid " + DS.ink,
            display: "flex", flexDirection: "column", zIndex: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px 6px", flex: "0 0 auto" }}>
              <div>
                <div style={{ fontFamily: DS.fDisp, fontSize: 22.6, color: DS.hi }}>{selCamp.name.toUpperCase()}</div>
                <div style={{ fontFamily: DS.fUi, fontSize: 12.4, color: DS.muted }}>{selCamp.count} events this edition</div>
              </div>
              <button onClick={() => setSelCamp(null)} aria-label="Close"
                style={{ fontSize: 24.9, cursor: "pointer", color: DS.muted, background: "none", border: "none", padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "6px 14px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
              {campEvents.map((e, i) => {
                const day = e.days[0];
                const newDay = i === 0 || campEvents[i - 1].days[0] !== day;
                return (
                  <Fragment key={e.id}>
                    {newDay && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: i === 0 ? "2px 0 1px" : "8px 0 1px" }}>
                        <span style={{ fontFamily: DS.fDisp, fontSize: 13.6, color: DS.hi, letterSpacing: 0.4, whiteSpace: "nowrap" }}>{DAY_FULL[day].toUpperCase()}</span>
                        <span style={{ flex: "1 1 auto", height: 0, borderTop: "2px dotted rgba(38,48,42,0.4)" }}></span>
                        <span style={{ fontFamily: DS.fMono, fontSize: 10, color: DS.brown, letterSpacing: 0.5, whiteSpace: "nowrap" }}>✶ {DAY_DATES[day]}</span>
                      </div>
                    )}
                    <button onClick={() => setSheet(e)} aria-label={e.title}
                      style={{ display: "flex", gap: 8, cursor: "pointer", width: "100%", textAlign: "left",
                      padding: "7px 8px", background: DS.paper, border: "1px solid rgba(38,48,42,0.15)" }}>
                      <span style={{ fontFamily: DS.fDisp, fontSize: 15.8, color: catColor(e.cat), flex: "0 0 auto", minWidth: 38 }}>
                        {fmtTime(e.time)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: DS.fUi, fontSize: 13.6, fontWeight: 700, color: DS.ink,
                          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.title}</div>
                        <div style={{ fontFamily: DS.fMono, fontSize: 11.3, color: DS.muted }}>{e.days.join(" / ")} · {catOf(e.cat).label}</div>
                      </div>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Nav active="Map" onChange={onTabChange} />
      {sheet && <EventSheet event={sheet} saved={saved.has(sheet.id)} onClose={() => setSheet(null)} onSave={onSave} />}
    </Phone>
  );
}
