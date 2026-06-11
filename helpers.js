// Small shared helpers for the WWW mockups. window.H
window.H = (function () {
  const W = window.WWW;
  const catMap = Object.fromEntries(W.cats.map(c => [c.key, c]));
  const dayFull = { Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday", Sun:"Sunday" };
  function fmtTime(t){ if(!t||t==="00:00") return "all day"; return t; }
  function cat(k){ return catMap[k] || {key:k,label:k,glyph:"●"}; }
  // pick n events for a given day, sorted by time, skipping all-day placeholders first
  function forDay(day, n){
    const list = W.events.filter(e => e.days.includes(day));
    list.sort((a,b)=>{
      const ta = a.time==="00:00" ? "99:99" : a.time;
      const tb = b.time==="00:00" ? "99:99" : b.time;
      return ta.localeCompare(tb);
    });
    return n ? list.slice(0,n) : list;
  }
  // a curated mixed sample (variety of categories) for hero/browse states
  function sample(ids){ return ids.map(id => W.events.find(e=>e.title===id)).filter(Boolean); }
  function pickVariety(day, n){
    const list = forDay(day);
    const seen = new Set(); const out=[];
    for(const e of list){ if(!seen.has(e.cat)){ seen.add(e.cat); out.push(e);} if(out.length>=n) break; }
    // top up if needed
    for(const e of list){ if(out.length>=n) break; if(!out.includes(e)) out.push(e); }
    return out.slice(0,n);
  }
  function count(){ return W.events.length; }
  function campCount(){ return W.camps.length; }

  // ---- orbit ring roads: smooth closed loop through the camps in plan order ----
  const ORBIT_ORDER = ["Garden of Joy","Ran'Dome","Desert Dessert","Barrio Espace","Glowy Owl","EYAO","Glitch",
    "Curious Creatures","ÜBERFIASCO","JamHouse","Mirage","Oasis Playground","Planet Pulpo","Olive Odyssey",
    "Bread & Tomato","Here & Meow","sssh!","Come & Play","Peach Please","Herding Cats","Werkhaüs",
    "Mercurial Retrogrades","Le Gratin","Pink poney paradise","NoBarrio","Dusty Dreamers","Jugaton",
    "Camp Cambio","Barrio del Sol"];
  // closed catmull-rom -> cubic bezier path through points [[x,y],...]
  function catmull(pts){
    const n = pts.length;
    let d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1) + " ";
    for (let i = 0; i < n; i++){
      const p0 = pts[(i-1+n)%n], p1 = pts[i], p2 = pts[(i+1)%n], p3 = pts[(i+2)%n];
      const c1 = [p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6];
      const c2 = [p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6];
      d += "C " + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + ", " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) + ", " + p2[0].toFixed(1) + " " + p2[1].toFixed(1) + " ";
    }
    return d + "Z";
  }
  // orbit path in 0-100 viewBox coords; yScale/yOff match the renderers' Y transform;
  // inflate scales the loop outward from its centroid (1 = through camps, 1.14 = perimeter road)
  function orbitD(yScale, yOff, inflate){
    yScale = yScale == null ? 0.74 : yScale; yOff = yOff == null ? 7 : yOff; inflate = inflate || 1;
    const byName = Object.fromEntries(W.camps.map(c => [c.name, c]));
    const raw = ORBIT_ORDER.map(n => byName[n]).filter(Boolean).map(c => [c.x, c.y * yScale + yOff]);
    const cx = raw.reduce((s,p)=>s+p[0],0)/raw.length, cy = raw.reduce((s,p)=>s+p[1],0)/raw.length;
    const pts = raw.map(p => [cx + (p[0]-cx)*inflate, cy + (p[1]-cy)*inflate]);
    return catmull(pts);
  }
  return { W, cat, fmtTime, dayFull, forDay, pickVariety, sample, count, campCount, orbitD };
})();
