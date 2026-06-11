import { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { DS, DAYS, DAY_FULL, DAY_DATES, CATS } from "../ds";
import { events } from "../data";
import { Phone, StatusBar, AdmitStrip, SearchInput, DayTabs, CatChips, NowStrip, StubCard, Nav, Ransom } from "../components/ui";
import { EventSheet } from "../sheets/EventSheet";
import type { Event, TabName } from "../types";

const BATCH = 50;

type ListItem =
  | { type: "header"; day: string; count: number }
  | { type: "event"; e: Event; day: string; i: number };

export function BrowseView({ saved, onSave, onTabChange }: {
  saved: Set<string>; onSave: (id: string) => void; onTabChange: (t: TabName) => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [sheet, setSheet] = useState<Event | null>(null);
  const [limit, setLimit] = useState(BATCH);
  const [activeDay, setActiveDay] = useState<string>(() => {
    for (const d of DAYS) if (events.some((e) => e.days.includes(d))) return d;
    return DAYS[0];
  });
  const listRef = useRef<HTMLDivElement>(null);

  const handleCatChange = useCallback((c: string) => setCat(c), []);
  const handleQueryChange = useCallback((q: string) => setQuery(q), []);

  // events filtered by category + search (NOT by day — days are sections)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return events.filter((e) => {
      if (cat && e.cat !== cat) return false;
      if (q) {
        return e.title.toLowerCase().includes(q) ||
          e.camp.toLowerCase().includes(q) ||
          (e.desc || "").toLowerCase().includes(q) ||
          (e.loc || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, cat]);

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

  const nowEvents = useMemo(() =>
    filtered.filter((e) => e.recur && e.days.includes(activeDay)), [filtered, activeDay]);

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
          <div onClick={() => setFiltersOpen((o) => !o)} style={{ cursor: "pointer",
            height: 46, display: "flex", alignItems: "center", gap: 11, padding: "0 16px 0 50px" }}>
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
          </div>
          {/* mini day rail — quick jump while collapsed */}
          <div style={{ display: "flex", gap: 5, padding: "0 16px 8px 50px" }}>
            {DAYS.map((d) => (
              <span key={d} onClick={() => handleDayJump(d)} style={{ flex: 1, textAlign: "center", cursor: "pointer",
                fontFamily: DS.fUi, fontSize: 11, fontWeight: 700, padding: "3px 0", borderRadius: 3,
                opacity: dayCounts[d] ? 1 : 0.35,
                border: d === activeDay ? "1.5px solid " + DS.accent : "1px solid rgba(38,48,42,0.25)",
                background: d === activeDay ? DS.accent : "transparent",
                color: d === activeDay ? DS.paper : DS.ink }}>{d.toUpperCase()}</span>
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
          {!query && <NowStrip events={nowEvents} onSelect={setSheet} />}
        </>
      )}
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
            <StubCard key={it.e.id + "-" + it.day + "-" + it.i} event={it.e} index={it.i}
              saved={saved.has(it.e.id)} onSelect={setSheet} onSave={onSave} />
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
          <div onClick={closePeek} style={{ position: "absolute", inset: 0, top: barBottom, zIndex: 5,
            background: "rgba(38,48,42,0.4)" }}></div>
          <div style={{ position: "absolute", left: 0, right: 0, top: barBottom, zIndex: 7, background: DS.paper,
            borderBottom: "2px solid " + DS.ink, boxShadow: "0 12px 26px rgba(38,48,42,0.3)", paddingBottom: 10 }}>
            <div style={{ fontFamily: DS.fMono, fontSize: 10, letterSpacing: 1.5, color: DS.brown,
              padding: "10px 18px 0 50px" }}>FILTER THE PROGRAM</div>
            <SearchInput value={query} onChange={handleQueryChange} />
            <CatChips active={cat} onChange={handleCatChange} />
            <div onClick={closePeek} style={{ margin: "6px 18px 0 50px", textAlign: "center", cursor: "pointer",
              fontFamily: DS.fUi, fontSize: 12, fontWeight: 700, color: DS.paper, background: DS.hi,
              padding: "7px", borderRadius: 3 }}>Done ✶</div>
          </div>
        </>
      )}
      <Nav active="Browse" onChange={onTabChange} />
      {sheet && <EventSheet event={sheet} saved={saved.has(sheet.id)} onClose={() => setSheet(null)} onSave={onSave} />}
    </Phone>
  );
}
