import { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { DS, DAYS, DAY_FULL, DAY_DATES, CATS } from "../ds";
import { events } from "../data";
import { Phone, StatusBar, AdmitStrip, SearchInput, DayTabs, CatChips, NowStrip, StubCard, Nav, Ransom, TimeSlider } from "../components/ui";
import { EventSheet } from "../sheets/EventSheet";
import { timeToMins, getRealNowMins, getFestivalDay } from "../helpers";
import type { Event, TabName } from "../types";

const BATCH = 50;

const FEATURED_IDS = new Set([
  "3fe82765-7615-457f-aa43-bb97ed0b1eb6", // Elsew...at? No way! WTF is going on?!
  "549ba833-5771-43df-b7b6-218cba53f893", // New Land for Elsewhere
  "76aacca8-24e6-4e10-81ab-1346df752023", // Shit Ninja Training
  "7179ff96-1cee-49b2-b464-25f6aa0560a9", // Volunteers meetup and party
  "f1ada340-926e-4d07-a6ec-881a4d384cc5", // How to make your barrio more inclusive?
]);

const MOE_LOC = "moe - middle of elsewhere";
const moeEvents = events.filter((e) => (e.loc ?? "").toLowerCase().includes("moe"));

type ListItem =
  | { type: "header"; day: string; count: number }
  | { type: "event"; e: Event; day: string; i: number };

function FeaturedStrip({ onSelect }: { onSelect: (e: Event) => void }) {
  const featuredEvents = events.filter((e) => FEATURED_IDS.has(e.id));
  if (!featuredEvents.length) return null;
  return (
    <div style={{ flex: "0 0 auto", padding: "4px 0 6px" }}>
      <div style={{ fontFamily: DS.fMono, fontSize: 9, letterSpacing: 1.5, color: DS.brown,
        padding: "0 18px 4px 50px" }}>✶ DON'T MISS</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 18px 2px 50px",
        scrollbarWidth: "none" }}>
        {featuredEvents.map((e) => (
          <button key={e.id} onClick={() => onSelect(e)}
            style={{ flex: "0 0 auto", cursor: "pointer", textAlign: "left",
              background: DS.hi, color: DS.paper, border: "none",
              padding: "8px 10px", width: 180 }}>
            <div style={{ fontFamily: DS.fMono, fontSize: 9, letterSpacing: 1,
              color: "rgba(232,223,201,0.6)", marginBottom: 3 }}>
              {e.days.map((d) => d.toUpperCase()).join(" · ")} · {e.time === "00:00" ? "all day" : e.time}
            </div>
            <div style={{ fontFamily: DS.fUi, fontSize: 13, fontWeight: 700, lineHeight: 1.2,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {e.title}
            </div>
            {e.camp && <div style={{ fontFamily: DS.fMono, fontSize: 9.5, marginTop: 4,
              color: "rgba(232,223,201,0.65)" }}>@ {e.camp}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BrowseView({ saved, onSave, onTabChange }: {
  saved: Set<string>; onSave: (id: string) => void; onTabChange: (t: TabName) => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [locFilter, setLocFilter] = useState<"moe" | "domes" | "night" | "">("");
  const [sheet, setSheet] = useState<Event | null>(null);
  const [limit, setLimit] = useState(BATCH);
  const [activeDay, setActiveDay] = useState<string>(() => {
    const fd = getFestivalDay();
    if (fd) return fd;
    for (const d of DAYS) if (events.some((e) => e.days.includes(d))) return d;
    return DAYS[0];
  });
  const listRef = useRef<HTMLDivElement>(null);

  // Time-travel: sliderMins drives "now" highlighting and list position.
  // realNowMins is fixed at mount; isRealNow means slider is at real current time.
  const realNowMins = useRef(getRealNowMins());
  const [sliderMins, setSliderMins] = useState(getRealNowMins);
  const isRealNow = Math.abs(sliderMins - realNowMins.current) < 2;
  const sliderDragging = useRef(false);

  const handleCatChange = useCallback((c: string) => setCat(c), []);
  const handleQueryChange = useCallback((q: string) => setQuery(q), []);

  // events filtered by category + location + search (NOT by day — days are sections)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return events.filter((e) => {
      if (cat && e.cat !== cat) return false;
      if (locFilter === "moe" && !(e.loc ?? "").toLowerCase().includes("moe")) return false;
      if (locFilter === "domes" && !(e.loc ?? "").toLowerCase().includes("dome")) return false;
      if (locFilter === "night") {
        if (!e.time || e.time === "00:00") return false;
        const m = timeToMins(e.time);
        if (m < 23 * 60 && m > 4 * 60) return false;
      }
      if (q) {
        return e.title.toLowerCase().includes(q) ||
          e.camp.toLowerCase().includes(q) ||
          (e.desc || "").toLowerCase().includes(q) ||
          (e.loc || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, cat, locFilter]);

  // flat, day-grouped item stream: [{header}, {event}, {event}…, {header}…]
  const { items, dayCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const arr: ListItem[] = [];
    for (const day of DAYS) {
      const evs = filtered.filter((e) => e.days.includes(day)).sort((a, b) => {
        const ta = a.time === "00:00" ? "99:99" : a.time, tb = b.time === "00:00" ? "99:99" : b.time;
        return ta.localeCompare(tb);
      });
      counts[day] = evs.length;
      if (evs.length) {
        arr.push({ type: "header", day, count: evs.length });
        evs.forEach((e, i) => arr.push({ type: "event", e, day, i }));
      }
    }
    return { items: arr, dayCounts: counts };
  }, [filtered]);

  const itemsRef = useRef(items); itemsRef.current = items;
  const limitRef = useRef(limit); limitRef.current = limit;
  const activeDayRef = useRef(activeDay); activeDayRef.current = activeDay;

  // Events happening "now" at the current slider time on the active day.
  const nowEvents = useMemo(() =>
    filtered.filter((e) => {
      if (!e.days.includes(activeDay)) return false;
      if (e.time === "00:00") return false;
      const start = timeToMins(e.time);
      const end = start + (e.dur > 0 ? e.dur : 60);
      return sliderMins >= start && sliderMins < end;
    }), [filtered, activeDay, sliderMins]);

  // collapsing header + tap-to-reveal filters
  const [collapsed, setCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDay, setPendingDay] = useState<string | null>(null);
  const peekRef = useRef(false);
  useEffect(() => { peekRef.current = filtersOpen; }, [filtersOpen]);

  // reset stream when the filter set changes — but stay on the SAME day
  // (search/category filter the program; they don't change which day you're viewing)
  useEffect(() => {
    const day = activeDayRef.current;
    const arr = itemsRef.current;
    let idx = arr.findIndex((it) => it.type === "header" && it.day === day);
    if (idx < 0) {  // current day has no results — fall back to first day that does
      idx = arr.findIndex((it) => it.type === "header");
      const firstDay = idx >= 0 ? (arr[idx] as { day: string }).day : day;
      if (firstDay !== day) setActiveDay(firstDay);
    }
    if (idx < 0) { setLimit(BATCH); listRef.current?.scrollTo(0, 0); return; }
    setLimit(Math.max(BATCH, idx + BATCH));
    setPendingDay((arr[idx] as { day: string }).day);
  }, [query, cat]);

  const scrollToDay = useCallback((day: string) => {
    const el = listRef.current; if (!el) return;
    const h = el.querySelector<HTMLElement>('[data-day-header="' + day + '"]');
    if (!h) return;
    el.scrollTop = Math.max(0, h.offsetTop - 6);  // instant (rAF/smooth can be paused offscreen)
    setCollapsed(el.scrollTop > 56);              // collapse header once we're past the top
  }, []);

  const scrollToTimeMins = useCallback((targetMins: number) => {
    const el = listRef.current; if (!el) return;
    const evEls = el.querySelectorAll<HTMLElement>("[data-event-time]");
    let target: HTMLElement | null = null;
    for (const ev of evEls) {
      const t = ev.getAttribute("data-event-time")!;
      if (t === "00:00") continue;
      if (timeToMins(t) >= targetMins) { target = ev; break; }
    }
    if (target) {
      el.scrollTop = Math.max(0, target.offsetTop - 100);
      setCollapsed(el.scrollTop > 56);
    }
  }, []);

  // jump the list to a day section (day tabs act as anchors, not filters)
  const handleDayJump = useCallback((day: string) => {
    setFiltersOpen(false);
    setActiveDay(day);
    const idx = itemsRef.current.findIndex((it) => it.type === "header" && it.day === day);
    if (idx < 0) return;
    if (idx >= limitRef.current) { setLimit(idx + BATCH); setPendingDay(day); }
    else scrollToDay(day);
  }, [scrollToDay]);

  // once the pending day's section has rendered, scroll to it
  useEffect(() => {
    if (pendingDay) { scrollToDay(pendingDay); setPendingDay(null); }
  }, [limit, pendingDay, scrollToDay]);

  // On mount: scroll to current real time within the active day.
  // Uses a one-shot ref so it only fires once after first render.
  const didInitScroll = useRef(false);
  useEffect(() => {
    if (didInitScroll.current) return;
    didInitScroll.current = true;
    // Defer to let the list paint first
    const id = requestAnimationFrame(() => scrollToTimeMins(realNowMins.current));
    return () => cancelAnimationFrame(id);
  }, [scrollToTimeMins]);

  // When the slider is moved, scroll the list to that time.
  const handleSliderChange = useCallback((m: number) => {
    sliderDragging.current = true;
    setSliderMins(m);
    scrollToTimeMins(m);
    // allow scroll-spy to resume after the programmatic scroll settles
    setTimeout(() => { sliderDragging.current = false; }, 300);
  }, [scrollToTimeMins]);

  const handleSliderReset = useCallback(() => {
    const m = getRealNowMins();
    realNowMins.current = m;
    setSliderMins(m);
    scrollToTimeMins(m);
  }, [scrollToTimeMins]);

  const onScroll = useCallback(() => {
    const el = listRef.current; if (!el) return;
    const st = el.scrollTop;
    // collapse header (unless filtering)
    if (!peekRef.current) setCollapsed((prev) => st > 56 ? true : (st < 10 ? false : prev));
    // infinite load
    if (el.scrollHeight - (st + el.clientHeight) < 900)
      setLimit((l) => Math.min(itemsRef.current.length, l + BATCH));
    // scroll-spy: which day is at the top?
    const heads = el.querySelectorAll<HTMLElement>("[data-day-header]");
    let cur: string | null = null;
    for (const h of heads) { if (h.offsetTop - st <= 84) cur = h.getAttribute("data-day-header"); else break; }
    if (cur) setActiveDay((prev) => cur !== prev ? cur! : prev);
    // sync slider to topmost event's time (unless slider is being dragged)
    if (!sliderDragging.current) {
      const evEls = el.querySelectorAll<HTMLElement>("[data-event-time]");
      let topMins: number | null = null;
      for (const ev of evEls) {
        const t = ev.getAttribute("data-event-time");
        if (!t || t === "00:00") continue;
        if (ev.offsetTop - st <= 130) topMins = timeToMins(t);
        else break;
      }
      if (topMins !== null) setSliderMins(topMins);
    }
  }, []);

  const closePeek = useCallback(() => {
    setFiltersOpen(false);
    const st = listRef.current ? listRef.current.scrollTop : 0;
    setCollapsed(st > 56);
  }, []);

  // Escape closes the filter overlay (the event sheet handles its own Escape first)
  const sheetRefB = useRef(sheet); sheetRefB.current = sheet;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !sheetRefB.current && peekRef.current) closePeek(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePeek]);

  const catLabel = (CATS.find((c) => c.key === cat) || CATS[0]).label;
  const visibleItems = items.slice(0, limit);

  // trailing spacer = one viewport, so even a short final day can scroll to the top
  const [padBottom, setPadBottom] = useState(600);
  useEffect(() => {
    const el = listRef.current; if (!el || typeof ResizeObserver === "undefined") return;
    const set = () => setPadBottom(el.clientHeight);
    set();
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // measure the slim bar so the filter overlay sits exactly beneath it (no peeking)
  const barRef = useRef<HTMLDivElement>(null);
  const [barBottom, setBarBottom] = useState(102);
  useLayoutEffect(() => {
    if (collapsed && barRef.current) setBarBottom(barRef.current.offsetTop + barRef.current.offsetHeight);
  }, [collapsed, filtersOpen]);

  return (
    <Phone>
      <StatusBar />
      <AdmitStrip />
      {collapsed ? (
        /* ── collapsed slim bar — day-spy + tap to reveal filters ── */
        <div ref={barRef} style={{ flex: "0 0 auto", zIndex: 6, background: DS.card,
          borderBottom: "2px dotted rgba(38,48,42,0.4)",
          boxShadow: filtersOpen ? "none" : "0 3px 8px rgba(38,48,42,0.12)" }}>
          <button onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} aria-controls="filter-overlay"
            style={{ cursor: "pointer", width: "100%",
            height: 46, display: "flex", alignItems: "center", gap: 11, padding: "0 16px 0 50px",
            background: "none", border: "none", textAlign: "left", fontFamily: "inherit" }}>
            <Ransom word="WWW" size={15} jitter={1} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}>
              <span style={{ fontFamily: DS.fUi, fontSize: 12.5, fontWeight: 700, color: DS.ink, whiteSpace: "nowrap" }}>
                {DAY_FULL[activeDay]}
              </span>
              <span style={{ fontFamily: DS.fMono, fontSize: 10, color: DS.muted, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                {catLabel}{query ? " · “" + query + "”" : ""} · {dayCounts[activeDay] || 0} events
              </span>
            </div>
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: DS.fUi, fontSize: 12.5, fontWeight: 700, color: DS.accent, whiteSpace: "nowrap" }}>
              Filters
              <span style={{ display: "inline-block", transition: "transform .2s",
                transform: filtersOpen ? "rotate(180deg)" : "none" }}>⌄</span>
            </span>
          </button>
          {/* mini day rail — quick jump while collapsed */}
          <div style={{ display: "flex", gap: 5, padding: "0 16px 8px 50px" }}>
            {DAYS.map((d) => (
              <button key={d} onClick={() => handleDayJump(d)} aria-pressed={d === activeDay}
                style={{ flex: 1, textAlign: "center", cursor: "pointer",
                fontFamily: DS.fUi, fontSize: 11, fontWeight: 700, padding: "3px 0", borderRadius: 3,
                opacity: dayCounts[d] ? 1 : 0.35,
                border: d === activeDay ? "1.5px solid " + DS.accent : "1px solid rgba(38,48,42,0.25)",
                background: d === activeDay ? DS.accent : "transparent",
                color: d === activeDay ? DS.paper : DS.ink }}>{d.toUpperCase()}</button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* masthead — collage ransom-note logo */}
          <div style={{ padding: "2px 18px 8px 50px", flex: "0 0 auto", zIndex: 2, position: "relative" }}>
            <div style={{ fontFamily: DS.fMono, fontSize: 11.3, letterSpacing: 1, color: DS.brown }}>ELSEWHERE '26 · MONEGROS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8, alignItems: "flex-start" }}>
              <Ransom word="WHAT" size={29} jitter={0} />
              <Ransom word="WHERE" size={29} jitter={2} />
              <Ransom word="WHEN" size={29} jitter={4} />
            </div>
            <span style={{ position: "absolute", right: 12, top: 34, transform: "rotate(7deg)",
              border: "2px solid " + DS.accent, color: DS.accent, fontFamily: DS.fUi, fontSize: 11.3, fontWeight: 700,
              padding: "4px 8px", letterSpacing: 1, borderRadius: 3 }}>THE<br />GUIDE</span>
          </div>
          <SearchInput value={query} onChange={handleQueryChange} />
          <DayTabs active={activeDay} onChange={handleDayJump} />
          <CatChips active={cat} onChange={handleCatChange} />
          {/* Location / time chips */}
          <div style={{ padding: "0 18px 6px 50px", flex: "0 0 auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["moe", "domes", "night"] as const).map((f) => {
              const active = locFilter === f;
              const label = f === "moe" ? "◈ Middle of Elsewhere" : f === "domes" ? "○ Domes" : "☽ Night";
              return (
                <button key={f} onClick={() => setLocFilter((l) => l === f ? "" : f)}
                  aria-pressed={active}
                  style={{ fontFamily: DS.fUi, fontSize: 12, fontWeight: 700, padding: "4px 10px",
                    borderRadius: 2, cursor: "pointer", userSelect: "none",
                    background: active ? DS.hi : "transparent",
                    color: active ? DS.paper : DS.hi,
                    border: "1.5px solid " + DS.hi }}>
                  {label}
                </button>
              );
            })}
          </div>
          {!query && <NowStrip events={nowEvents} onSelect={setSheet} />}
          {/* Featured events strip */}
          {!query && !locFilter && (
            <FeaturedStrip onSelect={setSheet} />
          )}
        </>
      )}
      <TimeSlider mins={sliderMins} onChange={handleSliderChange} onReset={handleSliderReset} isRealNow={isRealNow} />
      {/* continuous, day-grouped list — infinite scroll */}
      <div ref={listRef} onScroll={onScroll} style={{ flex: "1 1 auto", overflowY: "auto", padding: "4px 18px 0 50px",
        position: "relative" }}>
        <div className="stub-grid">
          {items.length === 0 && (
            <div className="grid-full" style={{ padding: "40px 0", textAlign: "center", fontFamily: DS.fUi, color: DS.muted, fontSize: 14.7 }}>
              No events found for this filter ✶
            </div>
          )}
          {visibleItems.map((it) => it.type === "header" ? (
            <div key={"h-" + it.day} data-day-header={it.day} className="grid-full"
              style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "14px 0 6px",
                borderBottom: "2px solid " + DS.ink, marginBottom: 2 }}>
              <span style={{ fontFamily: DS.fDisp, fontSize: 21, color: DS.hi, letterSpacing: 0.3, lineHeight: 1 }}>{DAY_FULL[it.day].toUpperCase()}</span>
              <span style={{ fontFamily: DS.fMono, fontSize: 11, color: DS.muted }}>{it.count} events</span>
              <span style={{ marginLeft: "auto", fontFamily: DS.fMono, fontSize: 10.5, color: DS.brown, letterSpacing: 1 }}>✶ {DAY_DATES[it.day]}</span>
            </div>
          ) : (
            <div key={it.e.id + "-" + it.day + "-" + it.i} data-event-time={it.e.time} className="grid-full">
              <StubCard event={it.e} index={it.i}
                saved={saved.has(it.e.id)} onSelect={setSheet} onSave={onSave} />
            </div>
          ))}
          {limit < items.length && (
            <div className="grid-full" style={{ padding: "14px 0 20px", textAlign: "center",
              fontFamily: DS.fMono, fontSize: 11, letterSpacing: 1, color: DS.muted }}>
              ✶ loading more ✶
            </div>
          )}
        </div>
        <div style={{ height: padBottom }}></div>
      </div>
      {/* filter overlay — search + categories only; days stay in the nav bar */}
      {collapsed && filtersOpen && (
        <>
          <div onClick={closePeek} aria-hidden="true" style={{ position: "absolute", inset: 0, top: barBottom, zIndex: 5,
            background: "rgba(38,48,42,0.4)" }}></div>
          <div id="filter-overlay" role="dialog" aria-modal="true" aria-label="Filter the program"
            style={{ position: "absolute", left: 0, right: 0, top: barBottom, zIndex: 7, background: DS.paper,
            borderBottom: "2px solid " + DS.ink, boxShadow: "0 12px 26px rgba(38,48,42,0.3)", paddingBottom: 10 }}>
            <div style={{ fontFamily: DS.fMono, fontSize: 10, letterSpacing: 1.5, color: DS.brown,
              padding: "10px 18px 0 50px" }}>FILTER THE PROGRAM</div>
            <SearchInput value={query} onChange={handleQueryChange} />
            <CatChips active={cat} onChange={handleCatChange} />
            <div style={{ padding: "4px 18px 4px 50px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["moe", "domes", "night"] as const).map((f) => {
                const active = locFilter === f;
                const label = f === "moe" ? "◈ Middle of Elsewhere" : f === "domes" ? "○ Domes" : "☽ Night";
                return (
                  <button key={f} onClick={() => setLocFilter((l) => l === f ? "" : f)}
                    aria-pressed={active}
                    style={{ fontFamily: DS.fUi, fontSize: 12, fontWeight: 700, padding: "4px 10px",
                      borderRadius: 2, cursor: "pointer",
                      background: active ? DS.hi : "transparent",
                      color: active ? DS.paper : DS.hi,
                      border: "1.5px solid " + DS.hi }}>
                    {label}
                  </button>
                );
              })}
            </div>
            <button onClick={closePeek} style={{ margin: "6px 18px 0 50px", display: "block", width: "calc(100% - 68px)", textAlign: "center", cursor: "pointer",
              fontFamily: DS.fUi, fontSize: 12, fontWeight: 700, color: DS.paper, background: DS.hi,
              padding: "7px", borderRadius: 3, border: "none" }}>Done ✶</button>
          </div>
        </>
      )}
      <Nav active="Browse" onChange={onTabChange} />
      {sheet && <EventSheet event={sheet} saved={saved.has(sheet.id)} onClose={() => setSheet(null)} onSave={onSave} />}
    </Phone>
  );
}
