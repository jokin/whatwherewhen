import { useState, useMemo, useRef, useEffect, useCallback, Fragment } from "react";
import { DS, DAYS, DAY_FULL, DAY_DATES, catOf, catColor } from "../ds";
import { events, camps } from "../data";
import { BARRIOS, NORGS, ART, ZONE_FILL, ZONE_STROKE } from "../data/map-geo";
import { fmtTime } from "../helpers";
import { Phone, StatusBar, AdmitStrip, SearchInput, Nav } from "../components/ui";
import { EventSheet } from "../sheets/EventSheet";
import type { Event, Camp, TabName } from "../types";

const campByName = new Map(camps.map((c) => [c.name, c]));

// Events hosted at an art installation (matched via loc field, case-insensitive)
function artEvents(label: string): Event[] {
  const l = label.toLowerCase().trim();
  return events.filter((e) => {
    const loc = (e.loc ?? "").toLowerCase().trim();
    return loc === l || loc.replace(/^(at |the |at the )/, "") === l || l.replace(/^the /, "") === loc.replace(/^(at |the |at the )/, "");
  }).sort((a, b) => {
    const da = DAYS.indexOf(a.days[0] as typeof DAYS[number]) * 100 + parseInt(a.time || "99", 10);
    const db = DAYS.indexOf(b.days[0] as typeof DAYS[number]) * 100 + parseInt(b.time || "99", 10);
    return da - db;
  });
}

// Shoelace area of a SVG path (rough proxy for barrio size)
function pathArea(d: string): number {
  const nums = d.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
  let area = 0;
  for (let i = 0; i + 3 < nums.length; i += 2) {
    area += nums[i] * nums[i + 3] - nums[i + 2] * nums[i + 1];
  }
  return Math.abs(area) / 2;
}

// Pre-compute areas once
const BARRIO_AREAS = BARRIOS.map(([path]) => pathArea(path));

// Label appears when: area * zoom² > LABEL_AREA_THRESHOLD
const LABEL_AREA_THRESHOLD = 280;

export function MapView({ saved, onSave, onTabChange }: {
  saved: Set<string>; onSave: (id: string) => void; onTabChange: (t: TabName) => void;
}) {
  const [query, setQuery] = useState("");
  const [selCamp, setSelCamp] = useState<Camp | null>(null);
  const [selArt, setSelArt] = useState<string | null>(null); // art installation label
  const [selMoE, setSelMoE] = useState(false);
  const [sheet, setSheet] = useState<Event | null>(null);

  const moeEvents = useMemo(() =>
    events.filter((e) => (e.loc ?? "").toLowerCase().includes("moe"))
      .sort((a, b) => {
        const da = DAYS.indexOf(a.days[0] as typeof DAYS[number]) * 100 + parseInt(a.time || "99", 10);
        const db = DAYS.indexOf(b.days[0] as typeof DAYS[number]) * 100 + parseInt(b.time || "99", 10);
        return da - db;
      }), []);

  // zoom/pan state
  const [tfm, setTfm] = useState({ s: 1, tx: 0, ty: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; lx: number; ly: number }>({ active: false, lx: 0, ly: 0 });
  const pinchRef = useRef<number | null>(null);

  const campEvents = useMemo(() => {
    if (!selCamp) return [];
    return events.filter((e) => e.camp === selCamp.name)
      .sort((a, b) => {
        const da = DAYS.indexOf(a.days[0] as typeof DAYS[number]) * 100 + parseInt(a.time || "99", 10);
        const db = DAYS.indexOf(b.days[0] as typeof DAYS[number]) * 100 + parseInt(b.time || "99", 10);
        return da - db;
      });
  }, [selCamp]);

  const artEvts = useMemo(() => selArt ? artEvents(selArt) : [], [selArt]);

  const matchedNames = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    return new Set(camps.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.name));
  }, [query]);

  // Wheel zoom
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? 1.15 : 0.87;
      setTfm((t) => {
        const ns = Math.min(6, Math.max(0.7, t.s * delta));
        return { s: ns, tx: mx - (mx - t.tx) * (ns / t.s), ty: my - (my - t.ty) * (ns / t.s) };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Touch pinch
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchRef.current === null) return;
      e.preventDefault();
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const rect = el.getBoundingClientRect();
      const mid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
      };
      const ratio = d / pinchRef.current;
      setTfm((t) => {
        const ns = Math.min(6, Math.max(0.7, t.s * ratio));
        return { s: ns, tx: mid.x - (mid.x - t.tx) * (ns / t.s), ty: mid.y - (mid.y - t.ty) * (ns / t.s) };
      });
      pinchRef.current = d;
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { active: true, lx: e.clientX, ly: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lx;
    const dy = e.clientY - dragRef.current.ly;
    dragRef.current.lx = e.clientX;
    dragRef.current.ly = e.clientY;
    setTfm((t) => ({ ...t, tx: t.tx + dx, ty: t.ty + dy }));
  }, []);

  const onPointerUp = useCallback(() => { dragRef.current.active = false; }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, []);
  const onTouchEnd = useCallback(() => { pinchRef.current = null; }, []);

  const escRef = useRef(sheet); escRef.current = sheet;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !escRef.current) setSelCamp(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      <div
        ref={wrapRef}
        onClick={() => { setSelCamp(null); setSelArt(null); setSelMoE(false); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ flex: "1 1 auto", position: "relative", overflow: "hidden", background: DS.paper, cursor: "grab", touchAction: "none" }}
      >
        <svg
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            transform: `translate(${tfm.tx}px,${tfm.ty}px) scale(${tfm.s})`,
            transformOrigin: "0 0",
            overflow: "visible",
          }}
          viewBox="-5 -5 245 200"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="3" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
            <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#f2e8d0"/>
              <stop offset="100%" stopColor="#e4d6b8"/>
            </radialGradient>
          </defs>

          {/* background */}
          <rect x="-5" y="-5" width="245" height="200" fill="url(#mapBg)"/>

          {/* Layer 1: shapes only (all filtered) */}
          <g transform="rotate(-10 115 95)">
            {BARRIOS.map(([path, name, zone]) => {
              const fill = ZONE_FILL[zone] ?? ZONE_FILL.yellow;
              const stroke = ZONE_STROKE[zone] ?? ZONE_STROKE.yellow;
              const isSelected = selCamp?.name === name;
              const dimmed = matchedNames !== null && !matchedNames.has(name);
              const highlighted = matchedNames !== null && matchedNames.has(name);
              const camp = campByName.get(name);
              return (
                <g key={name} filter="url(#rough)" style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelCamp(isSelected ? null : (camp ?? null)); setSelArt(null); }}
                >
                  <path d={path}
                    fill={isSelected ? DS.accent : fill}
                    fillOpacity={dimmed ? 0.2 : isSelected ? 0.85 : highlighted ? 0.92 : 0.72}
                    stroke={isSelected ? DS.accent : stroke}
                    strokeWidth={isSelected ? 1.2 : 0.85}
                    strokeOpacity={dimmed ? 0.3 : 1}
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* NORG structures on top of barrio fills */}
            {NORGS.map(([path, name]) => {
              const isMoE = name === "MoE";
              return (
                <g key={name} filter={isMoE ? undefined : "url(#rough)"}
                  style={isMoE ? { cursor: "pointer" } : undefined}
                  onClick={isMoE ? (e) => { e.stopPropagation(); setSelCamp(null); setSelArt(null); setSelMoE((v) => !v); } : undefined}>
                  <path d={path}
                    fill={isMoE ? (selMoE ? "rgba(46,68,57,0.6)" : "rgba(46,68,57,0.4)") : "rgba(90,65,40,0.12)"}
                    stroke={isMoE ? "rgba(46,68,57,0.9)" : "rgba(90,65,40,0.5)"}
                    strokeWidth={isMoE ? "1.5" : "0.7"}
                    strokeDasharray={isMoE ? "none" : "1.8 1.2"}
                    strokeLinejoin="round"/>
                </g>
              );
            })}

            {/* MoE — large invisible hit area + visible marker */}
            {(() => {
              const MOE_CX = 95.8, MOE_CY = 80.9;
              return (
                <g style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelCamp(null); setSelArt(null); setSelMoE((v) => !v); }}>
                  {/* transparent hit area */}
                  <circle cx={MOE_CX} cy={MOE_CY} r={9} fill="transparent" />
                  {/* outer pulse ring */}
                  <circle cx={MOE_CX} cy={MOE_CY} r={selMoE ? 7 : 6}
                    fill="none"
                    stroke={selMoE ? DS.hi : "rgba(46,68,57,0.55)"}
                    strokeWidth={selMoE ? "1.2" : "0.8"}
                    strokeDasharray={selMoE ? "none" : "2 1.5"} />
                  {/* inner dot */}
                  <circle cx={MOE_CX} cy={MOE_CY} r={selMoE ? 3 : 2.2}
                    fill={selMoE ? DS.hi : "rgba(46,68,57,0.8)"}
                    stroke={selMoE ? DS.hi : "rgba(46,68,57,0.9)"}
                    strokeWidth="0.5" />
                  {/* star glyph */}
                  <text x={MOE_CX} y={MOE_CY + 0.85} fontSize={selMoE ? 3.2 : 2.6}
                    fill={DS.paper} textAnchor="middle" dominantBaseline="middle"
                    fontFamily="serif" style={{ pointerEvents: "none" }}>✶</text>
                </g>
              );
            })()}

            {/* Art — no events: tiny dots */}
            {ART.filter(([,,,ev]) => ev === 0).map(([x, y, label]) => (
              <circle key={label} cx={x} cy={y} r="1.2"
                fill="rgba(100,65,35,0.4)" stroke="rgba(100,65,35,0.55)" strokeWidth="0.4"/>
            ))}

            {/* Art — with events: small prominent dots */}
            {ART.filter(([,,,ev]) => ev > 0).map(([x, y, label, ev]) => {
              const isSelArt = selArt === label;
              return (
                <g key={label} style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelCamp(null); setSelArt(isSelArt ? null : label); }}>
                  <circle cx={x} cy={y} r="1.8" fill={isSelArt ? DS.accent : "#5c2518"} stroke={isSelArt ? DS.accent : "#3a1510"} strokeWidth="0.7"/>
                  <circle cx={x} cy={y} r="3.5" fill="none" stroke={isSelArt ? DS.accent : "rgba(92,37,24,0.35)"} strokeWidth="0.6"/>
                  <title>{label} · {ev} event{ev > 1 ? "s" : ""}</title>
                </g>
              );
            })}
          </g>

          {/* Layer 2: all labels — separate group AFTER all filtered shapes so they're always on top */}
          <g transform="rotate(-10 115 95)" style={{ pointerEvents: "none" }}>
            {/* Barrio labels — zoom-invariant, area-gated to avoid clutter */}
            {BARRIOS.map(([, name, , cx, cy], i) => {
              const isSelected = selCamp?.name === name;
              const dimmed = matchedNames !== null && !matchedNames.has(name);
              if (dimmed) return null;
              const area = BARRIO_AREAS[i];
              if (area * tfm.s * tfm.s < LABEL_AREA_THRESHOLD) return null;
              const fs = 4 / tfm.s;
              return (
                <text key={`lbl-${name}`}
                  x={cx} y={cy + fs * 0.4} fontSize={fs}
                  fill={isSelected ? DS.paper : DS.ink}
                  stroke={isSelected ? DS.accent : "#f2e8d0"}
                  strokeWidth={1.2 / tfm.s}
                  paintOrder="stroke fill"
                  textAnchor="middle" fontFamily="'Special Elite', monospace"
                  transform={`rotate(10 ${cx} ${cy})`}>
                  {name}
                </text>
              );
            })}

            {/* MoE label — always visible, zoom-invariant */}
            {(() => {
              const MOE_CX = 95.8, MOE_CY = 80.9;
              const fs = 2.8 / tfm.s;
              const offset = 8 / tfm.s;
              return (
                <text x={MOE_CX} y={MOE_CY - offset} fontSize={fs}
                  fill={selMoE ? DS.hi : DS.ink}
                  stroke="#f2e8d0" strokeWidth={0.9 / tfm.s}
                  paintOrder="stroke fill"
                  textAnchor="middle" fontFamily="'Special Elite', monospace" fontWeight="bold"
                  transform={`rotate(10 ${MOE_CX} ${MOE_CY})`}>
                  MAIN STAGE
                </text>
              );
            })()}

            {/* Art-with-events labels — only show when selected or very zoomed in */}
            {ART.filter(([,,,ev]) => ev > 0).map(([x, y, label]) => {
              const isSelArt = selArt === label;
              if (!isSelArt && tfm.s < 2.5) return null;
              const fs = 3.5 / tfm.s;
              const offset = 5.5 / tfm.s;
              return (
                <text key={`art-lbl-${label}`}
                  x={x} y={y - offset} fontSize={fs}
                  fill="#3a1510" stroke="#f2e8d0" strokeWidth={1 / tfm.s}
                  paintOrder="stroke fill"
                  textAnchor="middle" fontFamily="'Special Elite', monospace" fontWeight="bold"
                  transform={`rotate(10 ${x} ${y})`}>
                  {label.length > 20 ? label.slice(0, 18) + "…" : label}
                </text>
              );
            })}
          </g>

          {/* GATE label */}
          <text x="228" y="168" fontSize="5.5" fill={DS.hi} fontFamily="'Special Elite', monospace"
            fontWeight="bold" textAnchor="middle" opacity="0.7" style={{ pointerEvents: "none" }}>GATE ⟶</text>
        </svg>

        {/* MoE panel */}
        {selMoE && (
          <div onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
            position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "52%",
            background: DS.card, borderTop: "2px solid " + DS.hi,
            display: "flex", flexDirection: "column", zIndex: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px 6px", flex: "0 0 auto" }}>
              <div>
                <div style={{ fontFamily: DS.fMono, fontSize: 9.5, letterSpacing: 1.5, color: DS.brown }}>MAIN STAGE</div>
                <div style={{ fontFamily: DS.fDisp, fontSize: 22, color: DS.hi }}>MIDDLE OF ELSEWHERE</div>
                <div style={{ fontFamily: DS.fUi, fontSize: 12, color: DS.muted }}>{moeEvents.length} events this edition</div>
              </div>
              <button onClick={() => setSelMoE(false)} aria-label="Close"
                style={{ fontSize: 24, cursor: "pointer", color: DS.muted, background: "none", border: "none", padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "6px 14px 12px",
              display: "flex", flexDirection: "column", gap: 7 }}>
              {moeEvents.map((e, i) => {
                const day = e.days[0];
                const newDay = i === 0 || moeEvents[i - 1].days[0] !== day;
                return (
                  <Fragment key={e.id + "-" + day}>
                    {newDay && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: i === 0 ? "2px 0 1px" : "8px 0 1px" }}>
                        <span style={{ fontFamily: DS.fDisp, fontSize: 13.6, color: DS.hi, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
                          {DAY_FULL[day].toUpperCase()}
                        </span>
                        <span style={{ flex: "1 1 auto", height: 0, borderTop: "2px dotted rgba(38,48,42,0.4)" }}/>
                        <span style={{ fontFamily: DS.fMono, fontSize: 10, color: DS.brown, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                          ✶ {DAY_DATES[day]}
                        </span>
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
                          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {e.title}
                        </div>
                        <div style={{ fontFamily: DS.fMono, fontSize: 11.3, color: DS.muted }}>
                          {e.days.join(" / ")} · {catOf(e.cat).label}
                        </div>
                      </div>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Camp bottom panel */}
        {selCamp && (
          <div onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
            position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "48%",
            background: DS.card, borderTop: "2px solid " + DS.ink,
            display: "flex", flexDirection: "column", zIndex: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px 6px", flex: "0 0 auto" }}>
              <div>
                <div style={{ fontFamily: DS.fDisp, fontSize: 22.6, color: DS.hi }}>{selCamp.name.toUpperCase()}</div>
                <div style={{ fontFamily: DS.fUi, fontSize: 12.4, color: DS.muted }}>{selCamp.count} events this edition</div>
              </div>
              <button onClick={() => setSelCamp(null)} aria-label="Close"
                style={{ fontSize: 24.9, cursor: "pointer", color: DS.muted, background: "none", border: "none", padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "6px 14px 12px",
              display: "flex", flexDirection: "column", gap: 7 }}>
              {campEvents.map((e, i) => {
                const day = e.days[0];
                const newDay = i === 0 || campEvents[i - 1].days[0] !== day;
                return (
                  <Fragment key={e.id}>
                    {newDay && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: i === 0 ? "2px 0 1px" : "8px 0 1px" }}>
                        <span style={{ fontFamily: DS.fDisp, fontSize: 13.6, color: DS.hi, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
                          {DAY_FULL[day].toUpperCase()}
                        </span>
                        <span style={{ flex: "1 1 auto", height: 0, borderTop: "2px dotted rgba(38,48,42,0.4)" }}/>
                        <span style={{ fontFamily: DS.fMono, fontSize: 10, color: DS.brown, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                          ✶ {DAY_DATES[day]}
                        </span>
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
                          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {e.title}
                        </div>
                        <div style={{ fontFamily: DS.fMono, fontSize: 11.3, color: DS.muted }}>
                          {e.days.join(" / ")} · {catOf(e.cat).label}
                        </div>
                      </div>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Art installation panel */}
        {selArt && (
          <div onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
            position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "48%",
            background: DS.card, borderTop: "2px solid " + DS.accent,
            display: "flex", flexDirection: "column", zIndex: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px 6px", flex: "0 0 auto" }}>
              <div>
                <div style={{ fontFamily: DS.fDisp, fontSize: 20, color: DS.accent }}>✶ {selArt.toUpperCase()}</div>
                <div style={{ fontFamily: DS.fUi, fontSize: 12.4, color: DS.muted }}>{artEvts.length} events at this installation</div>
              </div>
              <button onClick={() => setSelArt(null)} aria-label="Close"
                style={{ fontSize: 24.9, cursor: "pointer", color: DS.muted, background: "none", border: "none", padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "6px 14px 12px",
              display: "flex", flexDirection: "column", gap: 7 }}>
              {artEvts.map((e, i) => {
                const day = e.days[0];
                const newDay = i === 0 || artEvts[i - 1].days[0] !== day;
                return (
                  <Fragment key={e.id}>
                    {newDay && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: i === 0 ? "2px 0 1px" : "8px 0 1px" }}>
                        <span style={{ fontFamily: DS.fDisp, fontSize: 13.6, color: DS.hi, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
                          {DAY_FULL[day].toUpperCase()}
                        </span>
                        <span style={{ flex: "1 1 auto", height: 0, borderTop: "2px dotted rgba(38,48,42,0.4)" }}/>
                        <span style={{ fontFamily: DS.fMono, fontSize: 10, color: DS.brown, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                          ✶ {DAY_DATES[day]}
                        </span>
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
                          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {e.title}
                        </div>
                        <div style={{ fontFamily: DS.fMono, fontSize: 11.3, color: DS.muted }}>
                          {e.days.join(" / ")} · {catOf(e.cat).label}
                        </div>
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
