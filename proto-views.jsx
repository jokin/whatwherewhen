/* global React, DS, Phone, StatusBar, AdmitStrip, SearchInput,
   DayTabs, CatChips, NowStrip, StubCard, EventSheet, Nav, Ransom, CalendarExportSheet */
// proto-views.jsx — Browse, Map and Mine views.
// Exports: BrowseView, MapView, MineView
(function () {
  const { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } = React;
  const WWW = window.WWW;

  /* ─── helpers ─────────────────────────────────── */
  function fmtTime(t){ return (!t||t==="00:00") ? "all day" : t; }
  const PAGESIZE = 40;

  /* ─── BROWSE ──────────────────────────────────── */
  const DATES = { Tue:"07 JUL", Wed:"08 JUL", Thu:"09 JUL", Fri:"10 JUL", Sat:"11 JUL", Sun:"12 JUL" };
  const BATCH = 50;

  window.BrowseView = function ({ saved, onSave, onTabChange, initialSearch }) {
    const [query, setQuery]   = useState(initialSearch || "");
    const [cat,   setCat]     = useState("");
    const [sheet, setSheet]   = useState(null);
    const [limit, setLimit]   = useState(BATCH);
    const [activeDay, setActiveDay] = useState(() => {
      for (const d of DS.DAYS) if (WWW.events.some(e => e.days.includes(d))) return d;
      return DS.DAYS[0];
    });
    const listRef = useRef();

    const handleCatChange   = useCallback(c => setCat(c), []);
    const handleQueryChange = useCallback(q => setQuery(q), []);

    // events filtered by category + search (NOT by day — days are sections)
    const filtered = useMemo(() => {
      const q = query.toLowerCase().trim();
      return WWW.events.filter(e => {
        if (cat && e.cat !== cat) return false;
        if (q) {
          return e.title.toLowerCase().includes(q) ||
                 e.camp.toLowerCase().includes(q)  ||
                 (e.desc||"").toLowerCase().includes(q) ||
                 (e.loc||"").toLowerCase().includes(q);
        }
        return true;
      });
    }, [query, cat]);

    // flat, day-grouped item stream: [{header}, {event}, {event}…, {header}…]
    const { items, dayCounts } = useMemo(() => {
      const counts = {}; const arr = [];
      for (const day of DS.DAYS) {
        const evs = filtered.filter(e => e.days.includes(day)).sort((a,b) => {
          const ta = a.time==="00:00"?"99:99":a.time, tb = b.time==="00:00"?"99:99":b.time;
          return ta.localeCompare(tb);
        });
        counts[day] = evs.length;
        if (evs.length) {
          arr.push({ type:"header", day, count: evs.length });
          evs.forEach((e,i) => arr.push({ type:"event", e, day, i }));
        }
      }
      return { items: arr, dayCounts: counts };
    }, [filtered]);

    const itemsRef = useRef(items); itemsRef.current = items;
    const limitRef = useRef(limit); limitRef.current = limit;
    const activeDayRef = useRef(activeDay); activeDayRef.current = activeDay;

    const nowEvents = useMemo(() =>
      filtered.filter(e => e.recur && e.days.includes(activeDay)), [filtered, activeDay]);

    // reset stream when the filter set changes — but stay on the SAME day
    // (search/category filter the program; they don't change which day you're viewing)
    useEffect(() => {
      const day = activeDayRef.current;
      const arr = itemsRef.current;
      let idx = arr.findIndex(it => it.type==="header" && it.day===day);
      if (idx < 0) {  // current day has no results — fall back to first day that does
        idx = arr.findIndex(it => it.type==="header");
        const firstDay = idx >= 0 ? arr[idx].day : day;
        if (firstDay !== day) setActiveDay(firstDay);
      }
      if (idx < 0) { setLimit(BATCH); listRef.current?.scrollTo(0,0); return; }
      setLimit(Math.max(BATCH, idx + BATCH));
      setPendingDay(arr[idx].day);
    }, [query, cat]);

    // collapsing header + tap-to-reveal filters
    const [collapsed, setCollapsed]     = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [pendingDay, setPendingDay]   = useState(null);
    const peekRef = useRef(false);
    useEffect(() => { peekRef.current = filtersOpen; }, [filtersOpen]);

    const scrollToDay = useCallback(day => {
      const el = listRef.current; if (!el) return;
      const h = el.querySelector('[data-day-header="' + day + '"]');
      if (!h) return;
      el.scrollTop = Math.max(0, h.offsetTop - 6);  // instant (rAF/smooth can be paused offscreen)
      setCollapsed(el.scrollTop > 56);              // collapse header once we're past the top
    }, []);

    // jump the list to a day section (day tabs act as anchors, not filters)
    const handleDayJump = useCallback(day => {
      setFiltersOpen(false);
      setActiveDay(day);
      const idx = itemsRef.current.findIndex(it => it.type==="header" && it.day===day);
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
      if (!peekRef.current) setCollapsed(prev => st > 56 ? true : (st < 10 ? false : prev));
      // infinite load
      if (el.scrollHeight - (st + el.clientHeight) < 900)
        setLimit(l => Math.min(itemsRef.current.length, l + BATCH));
      // scroll-spy: which day is at the top?
      const heads = el.querySelectorAll('[data-day-header]');
      let cur = null;
      for (const h of heads) { if (h.offsetTop - st <= 84) cur = h.getAttribute('data-day-header'); else break; }
      if (cur) setActiveDay(prev => cur !== prev ? cur : prev);
    }, []);

    const closePeek = useCallback(() => {
      setFiltersOpen(false);
      const st = listRef.current ? listRef.current.scrollTop : 0;
      setCollapsed(st > 56);
    }, []);

    // Escape closes the filter overlay (the event sheet handles its own Escape first)
    const sheetRefB = useRef(sheet); sheetRefB.current = sheet;
    useEffect(() => {
      const onKey = e => { if (e.key === "Escape" && !sheetRefB.current && peekRef.current) closePeek(); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [closePeek]);

    const catLabel = (DS.CATS.find(c => c.key === cat) || DS.CATS[0]).label;
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
    const barRef = useRef();
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
          <div ref={barRef} style={{ flex:"0 0 auto", zIndex:6, background: DS.card,
            borderBottom:"2px dotted rgba(38,48,42,0.4)",
            boxShadow: filtersOpen ? "none" : "0 3px 8px rgba(38,48,42,0.12)" }}>
            <div onClick={() => setFiltersOpen(o => !o)} style={{ cursor:"pointer",
              height:46, display:"flex", alignItems:"center", gap:11, padding:"0 16px 0 50px" }}>
              <Ransom word="WWW" size={15} jitter={1} />
              <div style={{ display:"flex", flexDirection:"column", lineHeight:1.15, minWidth:0 }}>
                <span style={{ fontFamily: DS.fUi, fontSize:12.5, fontWeight:700, color: DS.ink, whiteSpace:"nowrap" }}>
                  {DS.DAY_FULL[activeDay]}
                </span>
                <span style={{ fontFamily: DS.fMono, fontSize:10, color: DS.muted, whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis", maxWidth:150 }}>
                  {catLabel}{query ? " · “"+query+"”" : ""} · {dayCounts[activeDay]||0} events
                </span>
              </div>
              <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:6,
                fontFamily: DS.fUi, fontSize:12.5, fontWeight:700, color: DS.accent, whiteSpace:"nowrap" }}>
                Filters
                <span style={{ display:"inline-block", transition:"transform .2s",
                  transform: filtersOpen ? "rotate(180deg)" : "none" }}>⌄</span>
              </span>
            </div>
            {/* mini day rail — quick jump while collapsed */}
            <div style={{ display:"flex", gap:5, padding:"0 16px 8px 50px" }}>
              {DS.DAYS.map(d => (
                <span key={d} onClick={() => handleDayJump(d)} style={{ flex:1, textAlign:"center", cursor:"pointer",
                  fontFamily: DS.fUi, fontSize:11, fontWeight:700, padding:"3px 0", borderRadius:3,
                  opacity: dayCounts[d] ? 1 : 0.35,
                  border: d===activeDay ? "1.5px solid "+DS.accent : "1px solid rgba(38,48,42,0.25)",
                  background: d===activeDay ? DS.accent : "transparent",
                  color: d===activeDay ? DS.paper : DS.ink }}>{d.toUpperCase()}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* masthead — collage ransom-note logo */}
            <div style={{ padding:"2px 18px 8px 50px", flex:"0 0 auto", zIndex:2, position:"relative" }}>
              <div style={{ fontFamily: DS.fMono, fontSize:11.3, letterSpacing:1, color: DS.brown }}>ELSEWHERE '26 · MONEGROS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:8, alignItems:"flex-start" }}>
                <Ransom word="WHAT"  size={29} jitter={0} />
                <Ransom word="WHERE" size={29} jitter={2} />
                <Ransom word="WHEN"  size={29} jitter={4} />
              </div>
              <span style={{ position:"absolute", right:12, top:34, transform:"rotate(7deg)",
                border:"2px solid "+DS.accent, color: DS.accent, fontFamily: DS.fUi, fontSize:11.3, fontWeight:700,
                padding:"4px 8px", letterSpacing:1, borderRadius:3 }}>THE<br/>GUIDE</span>
            </div>
            <SearchInput value={query} onChange={handleQueryChange} />
            <DayTabs active={activeDay} onChange={handleDayJump} />
            <CatChips active={cat} onChange={handleCatChange} />
            {!query && <NowStrip events={nowEvents} onSelect={setSheet} />}
          </>
        )}
        {/* continuous, day-grouped list — infinite scroll */}
        <div ref={listRef} onScroll={onScroll} style={{ flex:"1 1 auto", overflowY:"auto", padding:"4px 18px 0 50px",
          position:"relative" }}>
          <div className="stub-grid">
            {items.length === 0 && (
              <div className="grid-full" style={{ padding:"40px 0", textAlign:"center", fontFamily: DS.fUi, color: DS.muted, fontSize:14.7 }}>
                No events found for this filter ✶
              </div>
            )}
            {visibleItems.map(it => it.type === "header" ? (
              <div key={"h-"+it.day} data-day-header={it.day} className="grid-full"
                style={{ display:"flex", alignItems:"baseline", gap:10, padding:"14px 0 6px",
                  borderBottom:"2px solid "+DS.ink, marginBottom:2 }}>
                <span style={{ fontFamily: DS.fDisp, fontSize:21, color: DS.hi, letterSpacing:0.3, lineHeight:1 }}>{DS.DAY_FULL[it.day].toUpperCase()}</span>
                <span style={{ fontFamily: DS.fMono, fontSize:11, color: DS.muted }}>{it.count} events</span>
                <span style={{ marginLeft:"auto", fontFamily: DS.fMono, fontSize:10.5, color: DS.brown, letterSpacing:1 }}>✶ {DATES[it.day]}</span>
              </div>
            ) : (
              <StubCard key={it.e.id+"-"+it.day+"-"+it.i} event={it.e} index={it.i}
                saved={saved.has(it.e.id)} onSelect={setSheet} onSave={onSave} />
            ))}
            {limit < items.length && (
              <div className="grid-full" style={{ padding:"14px 0 20px", textAlign:"center",
                fontFamily: DS.fMono, fontSize:11, letterSpacing:1, color: DS.muted }}>
                ✶ loading more ✶
              </div>
            )}
          </div>
          <div style={{ height: padBottom }}></div>
        </div>
        {/* filter overlay — search + categories only; days stay in the nav bar */}
        {collapsed && filtersOpen && (
          <>
            <div onClick={closePeek} style={{ position:"absolute", inset:0, top:barBottom, zIndex:5,
              background:"rgba(38,48,42,0.4)" }}></div>
            <div style={{ position:"absolute", left:0, right:0, top:barBottom, zIndex:7, background: DS.paper,
              borderBottom:"2px solid "+DS.ink, boxShadow:"0 12px 26px rgba(38,48,42,0.3)", paddingBottom:10 }}>
              <div style={{ fontFamily: DS.fMono, fontSize:10, letterSpacing:1.5, color: DS.brown,
                padding:"10px 18px 0 50px" }}>FILTER THE PROGRAM</div>
              <SearchInput value={query} onChange={handleQueryChange} />
              <CatChips active={cat} onChange={handleCatChange} />
              <div onClick={closePeek} style={{ margin:"6px 18px 0 50px", textAlign:"center", cursor:"pointer",
                fontFamily: DS.fUi, fontSize:12, fontWeight:700, color: DS.paper, background: DS.hi,
                padding:"7px", borderRadius:3 }}>Done ✶</div>
            </div>
          </>
        )}
        <Nav active="Browse" onChange={onTabChange} />
        {sheet && <EventSheet event={sheet} saved={saved.has(sheet.id)} onClose={() => setSheet(null)} onSave={onSave} />}
      </Phone>
    );
  };

  /* ─── MAP ──────────────────────────────────────── */
  window.MapView = function ({ saved, onSave, onTabChange }) {
    const [query, setQuery]   = useState("");
    const [selCamp, setSelCamp] = useState(null);
    const [sheet, setSheet]   = useState(null);

    const filteredCamps = useMemo(() => {
      const q = query.toLowerCase().trim();
      if (!q) return WWW.camps;
      return WWW.camps.filter(c => c.name.toLowerCase().includes(q));
    }, [query]);

    const campEvents = useMemo(() => {
      if (!selCamp) return [];
      return WWW.events.filter(e => e.camp === selCamp.name)
        .sort((a,b) => {
          const da = DS.DAYS.indexOf(a.days[0])*100 + parseInt(a.time||"99",10);
          const db = DS.DAYS.indexOf(b.days[0])*100 + parseInt(b.time||"99",10);
          return da-db;
        });
    }, [selCamp]);

    // Escape closes the camp panel (the event sheet handles its own Escape first)
    const sheetRef = useRef(sheet); sheetRef.current = sheet;
    useEffect(() => {
      const onKey = e => { if (e.key === "Escape" && !sheetRef.current) setSelCamp(null); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    const Y = y => (y * 0.74 + 7);
    // orbit helper from helpers.js
    const od1 = window.H ? H.orbitD(0.74,7,1.18) : "";
    const od2 = window.H ? H.orbitD(0.74,7,1)    : "";

    return (
      <Phone>
        <StatusBar />
        <AdmitStrip />
        <div style={{ padding:"2px 18px 6px 50px", flex:"0 0 auto", zIndex:2 }}>
          <div style={{ fontFamily: DS.fDisp, fontSize:29.4, lineHeight:0.95, color: DS.hi }}>THE CITY</div>
          <div style={{ fontFamily: DS.fUi, fontSize:12.4, color: DS.brown }}>37 barrios · tap a camp</div>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="search a barrio…" />
        {/* map */}
        <div onClick={() => setSelCamp(null)} style={{ flex:"1 1 auto", position:"relative", overflow:"hidden", background: DS.paper }}>
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={od1} fill="none" stroke={DS.brown} strokeOpacity="0.55" strokeWidth="2.5"
              strokeDasharray="7 5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            <path d={od2} fill="rgba(220,207,174,0.4)" stroke={DS.ink} strokeOpacity="0.4" strokeWidth="1.5"
              strokeDasharray="2 4" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            <path d="M 86 71 C 92 74, 95 80, 97 88" fill="none" stroke={DS.brown} strokeOpacity="0.5" strokeWidth="2.5"
              strokeDasharray="7 5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </svg>
          {/* burn */}
          <div style={{ position:"absolute", left:"46%", top:Y(46)+"%", transform:"translate(-50%,-50%) rotate(-6deg)", zIndex:4, textAlign:"center" }}>
            <div style={{ border:"2.5px solid "+DS.accent, color: DS.accent, borderRadius:"50%", width:50, height:50,
              background:"color-mix(in srgb,"+DS.accent+" 10%,transparent)",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:14.7 }}>✶</span>
              <span style={{ fontFamily: DS.fUi, fontSize:7.9, fontWeight:700, letterSpacing:0.5 }}>THE BURN</span>
            </div>
          </div>
          {/* GATE */}
          <div style={{ position:"absolute", right:8, bottom:40, transform:"rotate(5deg)", zIndex:4,
            border:"2px solid "+DS.hi, color: DS.hi, fontFamily: DS.fUi, fontSize:10.2, fontWeight:700,
            padding:"2px 6px", borderRadius:3 }}>GATE ⟶</div>
          {/* camps */}
          {filteredCamps.map((c,i) => {
            const big = c.count >= 16;
            const sel = selCamp?.name === c.name;
            return (
              <div key={c.name} onClick={(ev) => { ev.stopPropagation(); setSelCamp(sel ? null : c); }}
                style={{ position:"absolute", left:c.x+"%", top:Y(c.y)+"%",
                  transform:"translate(-50%,-50%) rotate("+((i%3-1)*3)+"deg)", zIndex: big?5:3, cursor:"pointer" }}>
                {big ? (
                  <span style={{ display:"inline-block", background: sel ? DS.accent : DS.card,
                    color: sel ? DS.paper : DS.ink,
                    border:"1px solid rgba(38,48,42,"+(sel?"0.0":"0.4")+")",
                    fontFamily: DS.fUi, fontSize:9.6, fontWeight:700, padding:"2px 5px",
                    boxShadow:"1px 1px 0 rgba(38,48,42,0.2)", whiteSpace:"nowrap",
                    transform: sel ? "scale(1.1)" : "none" }}>{c.name}</span>
                ) : (
                  <span style={{ display:"block", width:7, height:7, borderRadius:"50%",
                    background: sel ? DS.accent : DS.brown,
                    border:"1.5px solid "+DS.paper, boxShadow:"0 0 0 1px "+DS.brown }}></span>
                )}
              </div>
            );
          })}
          {/* Camp bottom panel */}
          {selCamp && (
            <div onClick={(ev) => ev.stopPropagation()} style={{ position:"absolute", left:0, right:0, bottom:0, maxHeight:"48%",
              background: DS.card, borderTop:"2px solid "+DS.ink,
              display:"flex", flexDirection:"column", zIndex:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"10px 14px 6px", flex:"0 0 auto" }}>
                <div>
                  <div style={{ fontFamily: DS.fDisp, fontSize:22.6, color: DS.hi }}>{selCamp.name.toUpperCase()}</div>
                  <div style={{ fontFamily: DS.fUi, fontSize:12.4, color: DS.muted }}>{selCamp.count} events this edition</div>
                </div>
                <span onClick={() => setSelCamp(null)} style={{ fontSize:24.9, cursor:"pointer", color: DS.muted }}>×</span>
              </div>
              <div style={{ flex:"1 1 auto", overflowY:"auto", padding:"6px 14px 12px", display:"flex", flexDirection:"column", gap:7 }}>
                {campEvents.map((e,i) => {
                  const day = e.days[0];
                  const newDay = i === 0 || campEvents[i-1].days[0] !== day;
                  return (
                  <React.Fragment key={e.id}>
                    {newDay && (
                      <div style={{ display:"flex", alignItems:"center", gap:8, margin: i===0?"2px 0 1px":"8px 0 1px" }}>
                        <span style={{ fontFamily: DS.fDisp, fontSize:13.6, color: DS.hi, letterSpacing:0.4, whiteSpace:"nowrap" }}>{DS.DAY_FULL[day].toUpperCase()}</span>
                        <span style={{ flex:"1 1 auto", height:0, borderTop:"2px dotted rgba(38,48,42,0.4)" }}></span>
                        <span style={{ fontFamily: DS.fMono, fontSize:10, color: DS.brown, letterSpacing:0.5, whiteSpace:"nowrap" }}>✶ {DATES[day]}</span>
                      </div>
                    )}
                    <div onClick={() => setSheet(e)} style={{ display:"flex", gap:8, cursor:"pointer",
                      padding:"7px 8px", background: DS.paper, border:"1px solid rgba(38,48,42,0.15)" }}>
                      <span style={{ fontFamily: DS.fDisp, fontSize:15.8, color: DS.catColor(e.cat), flex:"0 0 auto", minWidth:38 }}>
                        {fmtTime(e.time)}
                      </span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontFamily: DS.fUi, fontSize:13.6, fontWeight:700, color: DS.ink,
                          display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{e.title}</div>
                        <div style={{ fontFamily: DS.fMono, fontSize:11.3, color: DS.muted }}>{e.days.join(" / ")} · {DS.CATS.find(c=>c.key===e.cat)?.label||"Other"}</div>
                      </div>
                    </div>
                  </React.Fragment>
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
  };

  /* ─── MINE ────────────────────────────────────── */
  window.MineView = function ({ saved, onSave, onTabChange }) {
    const [sheet, setSheet]         = useState(null);
    const [exportOpen, setExportOpen] = useState(false);
    const savedEvents = useMemo(() =>
      WWW.events.filter(e => saved.has(e.id))
        .sort((a,b) => DS.DAYS.indexOf(a.days[0]) - DS.DAYS.indexOf(b.days[0])), [saved]);

    return (
      <Phone>
        <StatusBar />
        <AdmitStrip />
        <div style={{ padding:"4px 18px 8px 50px", flex:"0 0 auto", zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
            <div>
              <div style={{ fontFamily: DS.fDisp, fontSize:29.4, lineHeight:0.95, color: DS.hi }}>MY SCHEDULE</div>
              <div style={{ fontFamily: DS.fUi, fontSize:12.4, color: DS.brown, marginTop:3 }}>
                {savedEvents.length} saved · tap to view
              </div>
            </div>
            {savedEvents.length > 0 && (
              <button onClick={() => setExportOpen(true)} style={{
                flex:"0 0 auto", marginTop:4,
                fontFamily: DS.fUi, fontSize:11, fontWeight:700, letterSpacing:0.5,
                color: DS.paper, background: DS.hi,
                border:"none", padding:"6px 10px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:5
              }}>
                <span style={{ fontSize:13 }}>◈</span> EXPORT
              </button>
            )}
          </div>
        </div>
        {savedEvents.length === 0
          ? (
            <div style={{ flex:"1 1 auto", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:32 }}>
              <div style={{ fontSize:36.2 }}>♡</div>
              <div style={{ fontFamily: DS.fUi, fontSize:14.7, color: DS.muted, textAlign:"center", lineHeight:1.5 }}>
                Nothing saved yet.<br/>Tap ♡ on any event to add it here.
              </div>
            </div>
          )
          : (
            <div style={{ flex:"1 1 auto", overflowY:"auto", padding:"0 18px 16px 50px" }}>
              <div className="stub-grid">
                {savedEvents.map((e,i) => (
                  <StubCard key={e.id} event={e} index={i} saved onSelect={setSheet} onSave={onSave} />
                ))}
              </div>
              <div style={{ height:12 }}></div>
            </div>
          )
        }
        <Nav active="Mine" onChange={onTabChange} />
        {sheet && <EventSheet event={sheet} saved={saved.has(sheet.id)} onClose={() => setSheet(null)} onSave={onSave} />}
        {exportOpen && <CalendarExportSheet events={savedEvents} onClose={() => setExportOpen(false)} />}
      </Phone>
    );
  };

})();
