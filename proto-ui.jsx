/* global React */
// proto-ui.jsx — B1 design-system components for the Elsewhere WWW prototype.
// Exports to window: DS, Phone, StatusBar, AdmitStrip, SearchInput,
//   DayTabs, CatChips, NowStrip, StubCard, EventSheet, Nav, MapSheet
(function () {
  const { useState, useEffect, useRef } = React;

  const DS = {
    paper: "#e8dfc9", card: "#f1ead8", ink: "#26302a",
    accent: "#8a3b2a", hi: "#2e4439", brown: "#7a5236",
    muted: "#857a62", photo: "#51648a",
    fDisp: "'Anton', sans-serif",
    fUi:   "'Special Elite','Courier Prime',monospace",
    fMono: "'Courier Prime',ui-monospace,monospace",
    DAYS: ["Tue","Wed","Thu","Fri","Sat","Sun"],
    DAY_FULL: { Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday", Sun:"Sunday" },
    CATS: [
      { key:"",      label:"All",       glyph:"✶", c:"#8a3b2a" },
      { key:"work",  label:"Workshops", glyph:"✷", c:"#9a6a2c" },
      { key:"adult", label:"Adults",    glyph:"✦", c:"#8c2f43" },
      { key:"party", label:"Parties",   glyph:"◆", c:"#7d4a86" },
      { key:"heal",  label:"Spiritual", glyph:"△", c:"#4d6a8a" },
      { key:"chill", label:"Chillout",  glyph:"◠", c:"#2f7d74" },
      { key:"food",  label:"Food",      glyph:"♥", c:"#a8502b" },
      { key:"kids",  label:"Kids",      glyph:"☼", c:"#b07d12" },
      { key:"other", label:"Other",     glyph:"●", c:"#6f5c43" },
    ],
    catColor: function (key) { const m = this.CATS.find(c => c.key === key); return (m && m.c) || this.accent; },
    NOISE: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
  };

  // Collage "ransom-note" word — mixed-font cut-out chips, jittered & shadowed.
  function Ransom({ word, size, jitter }) {
    const serif = "Georgia, 'Times New Roman', serif";
    const CUTS = [
      { fontFamily: DS.fDisp, bg: DS.hi,     fg: DS.paper, border: "none",                            pad: "1px 4px" },
      { fontFamily: serif,    bg: "#f4eedd", fg: DS.ink,   border: "1px solid rgba(38,48,42,0.25)", fontStyle: "italic", pad: "1px 5px" },
      { fontFamily: DS.fDisp, bg: "#f4eedd", fg: DS.hi,    border: "1px solid rgba(38,48,42,0.2)",  pad: "1px 4px" },
      { fontFamily: DS.fMono, bg: DS.ink,    fg: DS.paper, border: "none", fontWeight: "700",         pad: "1px 5px" },
      { fontFamily: DS.fDisp, bg: "#dccfae", fg: DS.ink,   border: "none",                            pad: "1px 4px" },
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

  function Phone({ children }) {
    return (
      <div style={{ width:"100%", height:"100%", background: DS.paper, color: DS.ink,
        fontFamily: DS.fUi, position:"relative", overflow:"hidden",
        display:"flex", flexDirection:"column",
        backgroundImage: DS.NOISE, backgroundSize:"140px 140px" }}>
        {children}
      </div>
    );
  }

  function StatusBar() {
    const [t, setT] = useState(() => new Date().toTimeString().slice(0,5));
    useEffect(() => { const id = setInterval(() => setT(new Date().toTimeString().slice(0,5)), 30000); return () => clearInterval(id); }, []);
    return (
      <div style={{ height:30, display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"0 18px 0 50px", fontFamily: DS.fUi, fontSize:13.6, color: DS.ink, flex:"0 0 auto", zIndex:2 }}>
        <span style={{ fontWeight:700 }}>{t}</span>
        <span style={{ color: DS.muted, whiteSpace:"nowrap" }}>no signal ✶ dusty</span>
      </div>
    );
  }

  function AdmitStrip() {
    return (
      <div style={{ position:"absolute", left:0, top:30, bottom:"calc(62px + env(safe-area-inset-bottom))", width:34, zIndex:3,
        borderRight:"2px dotted rgba(38,48,42,0.45)", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"space-between", padding:"14px 0 12px",
        background:"color-mix(in srgb,#2e4439 12%,transparent)" }}>
        <span style={{ writingMode:"vertical-rl", transform:"rotate(180deg)", fontFamily: DS.fDisp,
          fontSize:12.4, letterSpacing:3, color: DS.hi }}>ADMIT ONE ✶ ELSEWHERE '26</span>
        <div style={{ width:12, height:56, background:"repeating-linear-gradient(0deg,#26302a 0 2px,transparent 2px 5px,#26302a 5px 6px,transparent 6px 10px)" }}></div>
      </div>
    );
  }

  function SearchInput({ value, onChange, placeholder }) {
    const ref = useRef();
    return (
      <div style={{ padding:"4px 18px 6px 50px", flex:"0 0 auto", zIndex:2 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, background: DS.card,
          border:"1.5px solid rgba(38,48,42,0.5)", borderRadius:3, padding:"9px 12px",
          boxShadow:"1px 2px 0 rgba(38,48,42,0.18)" }} onClick={() => ref.current?.focus()}>
          <span style={{ fontWeight:700, fontSize:15.8 }}>⌕</span>
          <input ref={ref} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder || "find happenings, camps…"}
            style={{ flex:1, border:"none", background:"transparent", fontFamily: DS.fUi,
              fontSize:14.7, color: DS.ink, outline:"none" }}/>
          {value && <span onClick={() => onChange("")} style={{ cursor:"pointer", color: DS.muted, fontSize:18.1 }}>×</span>}
        </div>
      </div>
    );
  }

  function DayTabs({ active, onChange }) {
    return (
      <div style={{ display:"flex", gap:5, padding:"4px 18px 4px 50px", flex:"0 0 auto", zIndex:2 }}>
        {DS.DAYS.map(d => (
          <span key={d} onClick={() => onChange(d)} style={{ flex:1, textAlign:"center",
            fontFamily: DS.fUi, fontSize:13.6, fontWeight:700, padding:"5px 0 4px", borderRadius:3,
            cursor:"pointer", userSelect:"none",
            border: d === active ? "2px solid "+DS.accent : "1.5px solid rgba(38,48,42,0.35)",
            color: d === active ? DS.paper : DS.ink,
            background: d === active ? DS.accent : "transparent",
            transform: d === active ? "rotate(-2deg)" : "none" }}>{d.toUpperCase()}</span>
        ))}
      </div>
    );
  }

  function CatChips({ active, onChange }) {
    const ref = useRef();
    const drag = useRef({ down:false, moved:false, startX:0, startLeft:0 });
    const [edges, setEdges] = useState({ left:false, right:false });

    const updateEdges = () => {
      const el = ref.current; if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
    };
    useEffect(() => {
      const el = ref.current; if (!el) return;
      updateEdges();
      const onWheel = e => {
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (!delta) return;
        const max = el.scrollWidth - el.clientWidth;
        if ((delta < 0 && el.scrollLeft > 0) || (delta > 0 && el.scrollLeft < max)) e.preventDefault();
        el.scrollLeft += delta; updateEdges();
      };
      el.addEventListener("wheel", onWheel, { passive:false });
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null;
      ro && ro.observe(el);
      return () => { el.removeEventListener("wheel", onWheel); ro && ro.disconnect(); };
    }, []);

    const onDown = e => {
      const el = ref.current; if (!el) return;
      drag.current = { down:true, moved:false, startX:e.clientX, startLeft:el.scrollLeft };
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    };
    const onMove = e => {
      const d = drag.current; if (!d.down) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 3) d.moved = true;
      ref.current.scrollLeft = d.startLeft - dx;
      updateEdges();
    };
    const onUp = () => { drag.current.down = false; };
    const click = key => () => { if (drag.current.moved) return; onChange(key); };
    const scrollBy = dir => () => { const el = ref.current; if (el) { el.scrollLeft += dir*160; updateEdges(); } };

    const fade = side => ({ position:"absolute", top:0, bottom:0, [side]: side==="left" ? 48 : 0, width:34,
      pointerEvents:"none", zIndex:4,
      background:"linear-gradient(to "+(side==="left"?"right":"left")+", "+DS.paper+" 30%, "+DS.paper+"00)" });

    return (
      <div style={{ position:"relative", flex:"0 0 auto", zIndex:2 }}>
        <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ display:"flex", gap:7, padding:"6px 18px 8px 50px",
            overflowX:"auto", scrollbarWidth:"none", cursor:"grab", touchAction:"pan-x" }}>
          {DS.CATS.map(c => {
            const on = c.key === active;
            const cc = c.c || DS.accent;
            return (
              <span key={c.key} onClick={click(on ? "" : c.key)} style={{ whiteSpace:"nowrap",
                flex:"0 0 auto", cursor:"pointer", userSelect:"none",
                fontFamily: DS.fUi, fontSize:12.4, fontWeight:700, padding:"5px 10px", borderRadius:2,
                background: on ? cc : DS.card,
                color: on ? DS.paper : DS.ink,
                border: on ? "none" : "1px solid "+cc+"66",
                boxShadow: on ? "none" : "1px 1px 0 rgba(38,48,42,0.1)" }}>
                <span style={{ color: on ? DS.paper : cc, marginRight:4 }}>{c.glyph}</span>{c.label}
              </span>
            );
          })}
        </div>
        {edges.left && <div style={fade("left")}></div>}
        {edges.right && (
          <>
            <div style={fade("right")}></div>
            <span onClick={scrollBy(1)} style={{ position:"absolute", right:2, top:"50%", transform:"translateY(-60%)",
              zIndex:5, cursor:"pointer", width:22, height:22, borderRadius:"50%", background: DS.card,
              border:"1px solid "+DS.ink+"55", display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily: DS.fUi, fontSize:14, fontWeight:700, color: DS.ink, boxShadow:"0 1px 2px rgba(38,48,42,0.2)" }}>›</span>
          </>
        )}
      </div>
    );
  }

  function NowStrip({ events, onSelect }) {
    const now = events.filter(e => e.recur).slice(0,2);
    if (!now.length) return null;
    return (
      <div style={{ margin:"6px 18px 2px 50px", flex:"0 0 auto", zIndex:2 }}>
        {now.map((e,i) => (
          <div key={e.id} onClick={() => onSelect(e)} style={{ cursor:"pointer",
            background: i===0 ? DS.accent : DS.hi, color: DS.paper,
            padding:"8px 12px", marginBottom: i===0&&now.length>1 ? 4 : 0,
            display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily: DS.fDisp, fontSize:12.4, letterSpacing:1, whiteSpace:"nowrap" }}>● NOW</span>
            <span style={{ fontFamily: DS.fDisp, fontSize:17, lineHeight:1, flex:1, minWidth:0,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.title.toUpperCase()}</span>
            <span style={{ fontFamily: DS.fUi, fontSize:11.3, whiteSpace:"nowrap", opacity:0.85 }}>{e.camp}</span>
          </div>
        ))}
      </div>
    );
  }

  function StubCard({ event, saved, onSelect, onSave, index }) {
    const cat = DS.CATS.find(c => c.key === event.cat) || DS.CATS[DS.CATS.length-1];
    const acc = cat.c || (index % 2 === 0 ? DS.accent : DS.hi);
    const t = event.time === "00:00" ? "✶" : event.time;
    return (
      <div onClick={() => onSelect(event)} style={{ display:"flex", background: DS.card,
        border:"1px solid rgba(38,48,42,0.25)", boxShadow:"1px 2px 0 rgba(38,48,42,0.14)",
        borderLeft:"5px solid "+acc, cursor:"pointer", position:"relative",
        transform:"rotate("+(index%2 ? 0.4:-0.4)+"deg)" }}>
        <div style={{ flex:"0 0 52px", borderRight:"2px dotted rgba(38,48,42,0.35)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:2, padding:"9px 0" }}>
          <span style={{ fontFamily: DS.fDisp, fontSize:17, color: acc, lineHeight:1 }}>{t}</span>
          {event.dur>0 && <span style={{ fontFamily: DS.fMono, fontSize:10.2, color: DS.muted }}>{event.dur}m</span>}
        </div>
        <div style={{ flex:"1 1 auto", minWidth:0, padding:"8px 10px 8px 10px" }}>
          <div style={{ fontFamily: DS.fUi, fontWeight:700, fontSize:14.7, lineHeight:1.25, color: DS.ink,
            paddingRight:74,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{event.title}</div>
          <div style={{ fontFamily: DS.fUi, fontSize:12.4, color: DS.brown, marginTop:2 }}>@ {event.camp}{event.loc?" · "+event.loc:""}</div>
          <div style={{ fontFamily: DS.fMono, fontSize:11.3, color: DS.muted, lineHeight:1.3, marginTop:3,
            display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{event.desc}</div>
        </div>
        <span style={{ position:"absolute", right:7, top:5, transform:"rotate("+(index%2?-4:4)+"deg)",
          background: acc, color: DS.paper, fontFamily: DS.fUi, fontSize:9, fontWeight:700,
          letterSpacing:1, padding:"2px 5px", borderRadius:2 }}>{cat.label.toUpperCase()}</span>
        <span onClick={ev => { ev.stopPropagation(); onSave(event.id); }}
          style={{ position:"absolute", right:6, bottom:5, fontSize:15.8, cursor:"pointer",
            color: saved ? DS.accent : DS.muted }}>
          {saved ? "♥" : "♡"}
        </span>
      </div>
    );
  }

  function EventSheet({ event, saved, onClose, onSave }) {
    const [vis, setVis] = useState(false);
    useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
    const close = () => { setVis(false); setTimeout(onClose, 280); };
    useEffect(() => {
      const onKey = e => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);
    if (!event) return null;
    const cat = DS.CATS.find(c => c.key === event.cat) || DS.CATS[DS.CATS.length-1];
    const cc = cat.c || DS.accent;
    return (
      <div style={{ position:"absolute", inset:0, zIndex:50 }}>
        <div onClick={close} style={{ position:"absolute", inset:0, background:"rgba(38,48,42,0.45)",
          opacity: vis?1:0, transition:"opacity 0.28s" }}></div>
        <div style={{ position:"absolute", left:0, right:0, bottom:0, height:"78%",
          background: DS.card, borderTop:"2px solid "+DS.ink,
          transform: vis ? "translateY(0)" : "translateY(100%)", transition:"transform 0.28s cubic-bezier(.2,.8,.3,1)",
          display:"flex", flexDirection:"column" }}>
          {/* drag handle */}
          <div style={{ flex:"0 0 auto", padding:"10px 18px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ width:40, height:4, background:"rgba(38,48,42,0.3)", borderRadius:2, margin:"0 auto 0 0" }}></div>
            <span onClick={close} style={{ fontSize:24.9, cursor:"pointer", color: DS.muted, lineHeight:1 }}>×</span>
          </div>
          <div style={{ flex:"1 1 auto", overflowY:"auto", padding:"0 18px 24px" }}>
            <div style={{ marginBottom:12, display:"flex", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
              <span style={{ background: cc, color: DS.paper, fontFamily: DS.fUi, fontSize:10.2, fontWeight:700,
                letterSpacing:1, padding:"3px 8px", transform:"rotate(-2deg)", display:"inline-block" }}>
                {cat.glyph} {cat.label.toUpperCase()}
              </span>
              {event.recur && <span style={{ border:"1.5px dashed "+DS.brown, color: DS.brown,
                fontFamily: DS.fUi, fontSize:10.2, padding:"3px 8px" }}>RECURRING</span>}
            </div>
            <div style={{ fontFamily: DS.fDisp, fontSize:29.4, lineHeight:1.0, color: DS.hi, marginBottom:10 }}>{event.title.toUpperCase()}</div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:14 }}>
              <div>
                <div style={{ fontFamily: DS.fMono, fontSize:10.2, letterSpacing:1, color: DS.muted }}>TIME</div>
                <div style={{ fontFamily: DS.fDisp, fontSize:24.9, color: cc }}>
                  {event.time==="00:00"?"All day":event.time}
                  {event.dur>0 && <span style={{ fontSize:14.7, color: DS.muted, marginLeft:8 }}>{event.dur} min</span>}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: DS.fMono, fontSize:10.2, letterSpacing:1, color: DS.muted }}>DAYS</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:3 }}>
                  {event.days.map(d => (
                    <span key={d} style={{ fontFamily: DS.fUi, fontSize:12.4, fontWeight:700, padding:"2px 7px",
                      background: DS.hi, color: DS.paper, borderRadius:2 }}>{d.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: DS.paper, border:"1px solid rgba(38,48,42,0.2)", padding:"10px 12px", marginBottom:14 }}>
              <div style={{ fontFamily: DS.fMono, fontSize:10.2, letterSpacing:1, color: DS.muted, marginBottom:4 }}>CAMP / VENUE</div>
              <div style={{ fontFamily: DS.fUi, fontSize:15.8, fontWeight:700, color: DS.ink }}>{event.camp}</div>
              {event.loc && <div style={{ fontFamily: DS.fUi, fontSize:13.6, color: DS.brown, marginTop:2 }}>{event.loc}</div>}
            </div>
            <div style={{ fontFamily: DS.fMono, fontSize:14.7, lineHeight:1.55, color: DS.ink }}>{event.desc}</div>
          </div>
          <div style={{ flex:"0 0 auto", padding:"12px 18px 20px", paddingBottom:"max(20px, calc(env(safe-area-inset-bottom) + 12px))", borderTop:"2px dotted rgba(38,48,42,0.35)",
            background: DS.card, display:"flex", gap:12 }}>
            <button onClick={() => onSave(event.id)} style={{ flex:1, display:"flex", alignItems:"center",
              justifyContent:"center", gap:8, padding:"12px", cursor:"pointer",
              background: saved ? DS.accent : "transparent", color: saved ? DS.paper : DS.ink,
              border:"2px solid "+(saved ? DS.accent : DS.ink), fontFamily: DS.fUi, fontSize:14.7, fontWeight:700 }}>
              {saved ? "♥ Saved" : "♡ Save to Mine"}
            </button>
            <button onClick={close} style={{ flex:1, padding:"12px", cursor:"pointer",
              background: DS.hi, color: DS.paper, border:"none",
              fontFamily: DS.fUi, fontSize:14.7, fontWeight:700 }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  function Nav({ active, onChange }) {
    const tabs = [["✶","Browse"],["◈","Map"],["♥","Mine"]];
    return (
      <div style={{ display:"flex", borderTop:"2px dotted rgba(38,48,42,0.45)", flex:"0 0 auto",
        background: DS.card, zIndex:10, position:"relative", paddingBottom:"env(safe-area-inset-bottom)" }}>
        {tabs.map(([g,l]) => (
          <div key={l} onClick={() => onChange(l)} style={{ flex:1, textAlign:"center", padding:"8px 0 12px",
            cursor:"pointer", background: l===active ? DS.hi : "transparent", color: l===active ? DS.paper : DS.muted }}>
            <div style={{ fontSize:18.1 }}>{g}</div>
            <div style={{ fontFamily: DS.fUi, fontSize:11.3, fontWeight: l===active?700:400 }}>{l}</div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Calendar export ────────────────────────────────────────
  const CAL_DATES = {
    Tue:"20260707", Wed:"20260708", Thu:"20260709",
    Fri:"20260710", Sat:"20260711", Sun:"20260712"
  };
  const CAL_DATE_LABELS = { Tue:"07 JUL", Wed:"08 JUL", Thu:"09 JUL", Fri:"10 JUL", Sat:"11 JUL", Sun:"12 JUL" };

  function icsEsc(s) {
    return (s || "").replace(/\\/g,"\\\\").replace(/,/g,"\\,").replace(/;/g,"\\;").replace(/\n/g,"\\n");
  }

  function calcTimes(event, day) {
    const d = CAL_DATES[day]; if (!d) return null;
    if (!event.time || event.time === "00:00")
      return { dtStart:"DTSTART;VALUE=DATE:"+d, dtEnd:"DTEND;VALUE=DATE:"+d };
    const [hh,mm] = event.time.split(":").map(Number);
    const ts = String(hh).padStart(2,"0")+String(mm).padStart(2,"0")+"00";
    const endM = hh*60+mm+(event.dur>0?event.dur:60);
    const te = String(Math.floor(endM/60)%24).padStart(2,"0")+String(endM%60).padStart(2,"0")+"00";
    return { dtStart:"DTSTART:"+d+"T"+ts, dtEnd:"DTEND:"+d+"T"+te };
  }

  function buildICS(events) {
    const lines = [
      "BEGIN:VCALENDAR","VERSION:2.0",
      "PRODID:-//Elsewhere '26//WWW//EN",
      "CALSCALE:GREGORIAN",
      "X-WR-CALNAME:Elsewhere '26 \u2014 My Schedule",
    ];
    for (const e of events) {
      for (const day of e.days) {
        const t = calcTimes(e, day); if (!t) continue;
        const loc = [e.camp,e.loc].filter(Boolean).join(" \u00b7 ");
        lines.push("BEGIN:VEVENT");
        lines.push("UID:"+e.id+"-"+day+"@elsewhere26");
        lines.push("DTSTAMP:20260611T000000Z");
        lines.push(t.dtStart); lines.push(t.dtEnd);
        lines.push("SUMMARY:"+icsEsc(e.title));
        if (e.desc) lines.push("DESCRIPTION:"+icsEsc(e.desc));
        if (loc)    lines.push("LOCATION:"+icsEsc(loc));
        lines.push("END:VEVENT");
      }
    }
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function buildGCalUrl(event, day) {
    const d = CAL_DATES[day||event.days[0]]; if (!d) return "#";
    let dates;
    if (!event.time||event.time==="00:00") {
      dates = d+"/"+d;
    } else {
      const [hh,mm] = event.time.split(":").map(Number);
      const ts = String(hh).padStart(2,"0")+String(mm).padStart(2,"0")+"00";
      const endM = hh*60+mm+(event.dur>0?event.dur:60);
      const te = String(Math.floor(endM/60)%24).padStart(2,"0")+String(endM%60).padStart(2,"0")+"00";
      dates = d+"T"+ts+"/"+d+"T"+te;
    }
    const loc = [event.camp,event.loc].filter(Boolean).join(" · ");
    return "https://calendar.google.com/calendar/render?action=TEMPLATE"
      +"&text="+encodeURIComponent(event.title)
      +"&dates="+encodeURIComponent(dates)
      +"&details="+encodeURIComponent(event.desc||"")
      +"&location="+encodeURIComponent(loc);
  }

  function CalendarExportSheet({ events, onClose }) {
    const [vis, setVis] = useState(false);
    const [done, setDone] = useState(false);
    useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
    const close = () => { setVis(false); setTimeout(onClose, 280); };
    useEffect(() => {
      const onKey = e => { if (e.key==="Escape") { e.stopPropagation(); close(); } };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleDownload = () => {
      const blob = new Blob([buildICS(events)], { type:"text/calendar;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "elsewhere-26-schedule.ics";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDone(true); setTimeout(() => setDone(false), 3500);
    };

    const totalOcc = events.reduce((n,e) => n+e.days.length, 0);
    const DAYS = DS.DAYS;

    return (
      <div style={{ position:"absolute", inset:0, zIndex:50 }}>
        <div onClick={close} style={{ position:"absolute", inset:0, background:"rgba(38,48,42,0.45)",
          opacity:vis?1:0, transition:"opacity 0.28s" }}></div>
        <div style={{ position:"absolute", left:0, right:0, bottom:0, height:"86%",
          background:DS.card, borderTop:"2px solid "+DS.ink,
          transform:vis?"translateY(0)":"translateY(100%)",
          transition:"transform 0.28s cubic-bezier(.2,.8,.3,1)",
          display:"flex", flexDirection:"column" }}>

          {/* handle + close */}
          <div style={{ flex:"0 0 auto", padding:"10px 18px 0",
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ width:40, height:4, background:"rgba(38,48,42,0.3)", borderRadius:2 }}></div>
            <span onClick={close} style={{ fontSize:24, cursor:"pointer", color:DS.muted, lineHeight:1 }}>×</span>
          </div>

          {/* heading */}
          <div style={{ flex:"0 0 auto", padding:"6px 18px 12px" }}>
            <div style={{ fontFamily:DS.fMono, fontSize:10, letterSpacing:1.5, color:DS.brown }}>ADD TO CALENDAR</div>
            <div style={{ fontFamily:DS.fDisp, fontSize:27, lineHeight:1, color:DS.hi, marginTop:3 }}>MY SCHEDULE</div>
            <div style={{ fontFamily:DS.fUi, fontSize:12, color:DS.muted, marginTop:4 }}>
              {events.length} saved{totalOcc>events.length?" · "+totalOcc+" occurrences":""}
            </div>
          </div>

          {/* scrollable body */}
          <div style={{ flex:"1 1 auto", overflowY:"auto", padding:"0 18px 32px" }}>

            {/* ── Primary: ICS download ── */}
            <button onClick={handleDownload} style={{
              width:"100%", display:"flex", alignItems:"center", gap:13, padding:"14px 14px",
              background: done ? DS.accent : DS.hi, color:DS.paper,
              border:"none", cursor:"pointer", textAlign:"left",
              transition:"background 0.25s", marginBottom:5 }}>
              <div style={{ flex:"0 0 auto", width:38, height:38,
                border:"2px solid rgba(232,223,201,0.45)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:DS.fDisp, fontSize:22, color:DS.paper }}>
                {done ? "✶" : "↓"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:DS.fUi, fontSize:15, fontWeight:700 }}>
                  {done ? "Downloaded! Open to import" : "Download .ics file"}
                </div>
                <div style={{ fontFamily:DS.fMono, fontSize:9.5, color:"rgba(232,223,201,0.65)", marginTop:2 }}>
                  {done ? "all "+events.length+" events in one file" : "all "+events.length+" events in one file"}
                </div>
              </div>
            </button>
            <div style={{ background:DS.paper, border:"1px solid rgba(38,48,42,0.15)",
              padding:"8px 10px", marginBottom:20,
              fontFamily:DS.fMono, fontSize:9.5, color:DS.muted, lineHeight:1.65 }}>
              <span style={{ color:DS.ink, fontWeight:700 }}>iOS</span> → opens in Apple Calendar &nbsp;✶&nbsp;
              <span style={{ color:DS.ink, fontWeight:700 }}>Android</span> → opens in Google Calendar &nbsp;✶&nbsp;
              <span style={{ color:DS.ink, fontWeight:700 }}>Desktop</span> → double-click to import
            </div>

            {/* ── Divider ── */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ flex:1, borderTop:"2px dotted rgba(38,48,42,0.3)" }}></div>
              <span style={{ fontFamily:DS.fMono, fontSize:9, letterSpacing:1.5, color:DS.muted, flex:"0 0 auto" }}>
                OR ADD ONE BY ONE TO GOOGLE CALENDAR
              </span>
              <div style={{ flex:1, borderTop:"2px dotted rgba(38,48,42,0.3)" }}></div>
            </div>
            <div style={{ fontFamily:DS.fMono, fontSize:9.5, color:DS.muted, marginBottom:14, lineHeight:1.5 }}>
              Tap any event to open it directly in Google Calendar.
            </div>

            {/* ── Per-day event list ── */}
            {DAYS.filter(d => events.some(e => e.days.includes(d))).map(day => {
              const dayEvs = events
                .filter(e => e.days.includes(day))
                .sort((a,b) => {
                  const ta = (!a.time||a.time==="00:00")?"99:99":a.time;
                  const tb = (!b.time||b.time==="00:00")?"99:99":b.time;
                  return ta.localeCompare(tb);
                });
              return (
                <div key={day} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8,
                    borderBottom:"2px solid "+DS.ink, paddingBottom:4, marginBottom:7 }}>
                    <span style={{ fontFamily:DS.fDisp, fontSize:15, color:DS.hi }}>
                      {DS.DAY_FULL[day].toUpperCase()}
                    </span>
                    <span style={{ fontFamily:DS.fMono, fontSize:9.5, color:DS.brown, letterSpacing:0.5 }}>
                      ✶ {CAL_DATE_LABELS[day]}
                    </span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {dayEvs.map(e => (
                      <a key={e.id} href={buildGCalUrl(e,day)} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:8,
                          background:DS.paper, border:"1px solid rgba(38,48,42,0.18)",
                          padding:"7px 9px", textDecoration:"none", color:"inherit" }}>
                        <span style={{ fontFamily:DS.fDisp, fontSize:13, color:DS.catColor(e.cat),
                          flex:"0 0 38px", lineHeight:1 }}>
                          {(!e.time||e.time==="00:00")?"✶":e.time}
                        </span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:DS.fUi, fontWeight:700, fontSize:12.5, color:DS.ink,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.title}</div>
                          <div style={{ fontFamily:DS.fMono, fontSize:9.5, color:DS.muted }}>{e.camp}</div>
                        </div>
                        <span style={{ flex:"0 0 auto", fontFamily:DS.fUi, fontSize:9.5, fontWeight:700,
                          color:DS.paper, background:DS.accent, padding:"3px 7px", whiteSpace:"nowrap" }}>
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

  Object.assign(window, { DS, Ransom, Phone, StatusBar, AdmitStrip, SearchInput, DayTabs, CatChips, NowStrip, StubCard, EventSheet, Nav, CalendarExportSheet });
})();
