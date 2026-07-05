import { useState, useEffect, useRef } from "react";
import { DS, DAYS, DAY_FULL, DAY_DATES, catColor } from "../ds";
import { parseICS, matchICSToEvents } from "../ics";
import { events as allEvents } from "../data";
import type { Event } from "../types";

type Phase = "input" | "loading" | "preview" | "done" | "error";

export function CalendarImportSheet({ saved, onClose, onImport }: {
  saved: Set<string>;
  onClose: () => void;
  onImport: (ids: string[]) => void;
}) {
  const [vis, setVis] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");
  const [url, setUrl] = useState("");
  const [matched, setMatched] = useState<Event[]>([]);
  const [totalParsed, setTotalParsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { requestAnimationFrame(() => { setVis(true); closeRef.current?.focus(); }); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 280); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const processICS = (text: string) => {
    const parsed = parseICS(text);
    setTotalParsed(parsed.length);
    const ids = matchICSToEvents(parsed, allEvents);
    const evs = allEvents.filter((e) => ids.includes(e.id));
    setMatched(evs);
    if (evs.length === 0) {
      setErrorMsg(
        parsed.length === 0
          ? "No events found in that file. Is it a valid .ics calendar?"
          : `Found ${parsed.length} calendar entries but none matched the Elsewhere '26 programme.`
      );
      setPhase("error");
    } else {
      setPhase("preview");
    }
  };

  const isHumansUrl = (u: string) => u.includes("humans.nobodies.team");

  const handleUrl = async () => {
    const u = url.trim(); if (!u) return;
    // Humans app blocks CORS — skip the fetch and guide user to download instead
    if (isHumansUrl(u)) {
      setPhase("error");
      setErrorMsg("__humans__");
      return;
    }
    setPhase("loading");
    try {
      const res = await fetch(u);
      if (!res.ok) throw new Error("HTTP " + res.status);
      processICS(await res.text());
    } catch {
      setPhase("error");
      setErrorMsg("Couldn't load that URL — the server may be blocking cross-origin requests. Download the .ics file and upload it instead.");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPhase("loading");
    const reader = new FileReader();
    reader.onload = (ev) => processICS(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    const newIds = matched.map((e) => e.id).filter((id) => !saved.has(id));
    onImport(newIds);
    setPhase("done");
    setTimeout(close, 1400);
  };

  const newCount = matched.filter((e) => !saved.has(e.id)).length;
  const alreadyCount = matched.length - newCount;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
      <div onClick={close} aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "rgba(38,48,42,0.45)",
          opacity: vis ? 1 : 0, transition: "opacity 0.28s" }} />
      <div role="dialog" aria-modal="true" aria-label="Import from calendar"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "86%",
          background: DS.card, borderTop: "2px solid " + DS.ink,
          transform: vis ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(.2,.8,.3,1)",
          display: "flex", flexDirection: "column" }}>

        {/* handle + close */}
        <div style={{ flex: "0 0 auto", padding: "10px 18px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div aria-hidden="true" style={{ width: 40, height: 4, background: "rgba(38,48,42,0.3)", borderRadius: 2 }} />
          <button ref={closeRef} onClick={close} aria-label="Close"
            style={{ fontSize: 24, cursor: "pointer", color: DS.muted, lineHeight: 1, background: "none", border: "none", padding: 0 }}>×</button>
        </div>

        {/* heading */}
        <div style={{ flex: "0 0 auto", padding: "6px 18px 12px" }}>
          <div style={{ fontFamily: DS.fMono, fontSize: 10, letterSpacing: 1.5, color: DS.brown }}>IMPORT FAVOURITES</div>
          <div style={{ fontFamily: DS.fDisp, fontSize: 27, lineHeight: 1, color: DS.hi, marginTop: 3 }}>MY SCHEDULE</div>
          <div style={{ fontFamily: DS.fUi, fontSize: 12, color: DS.muted, marginTop: 4 }}>
            Import from Humans app or any .ics calendar file
          </div>
        </div>

        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "0 18px 32px" }}>

          {/* ── input phase ── */}
          {(phase === "input" || phase === "error") && (<>

            {/* Humans app block */}
            <div style={{ background: DS.hi, color: DS.paper, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontFamily: DS.fMono, fontSize: 9.5, letterSpacing: 1,
                color: "rgba(232,223,201,0.6)", marginBottom: 6 }}>FROM HUMANS APP</div>
              <div style={{ fontFamily: DS.fUi, fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>
                Go to <a href="https://humans.nobodies.team/Shifts/Mine" target="_blank" rel="noopener noreferrer"
                  style={{ color: DS.paper, fontWeight: 700, textDecoration: "underline" }}>
                  humans.nobodies.team/Shifts/Mine
                </a>, find your iCal feed link and paste it below — or download the .ics file and upload it.
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrl()}
                  placeholder="https://humans.nobodies.team/api/ical/…"
                  style={{ flex: 1, fontFamily: DS.fMono, fontSize: 11, padding: "8px 10px",
                    border: "1.5px solid rgba(232,223,201,0.35)", background: "rgba(232,223,201,0.12)",
                    color: DS.paper, outline: "none", minWidth: 0 }} />
                <button onClick={handleUrl} disabled={!url.trim()}
                  style={{ flex: "0 0 auto", fontFamily: DS.fUi, fontSize: 12, fontWeight: 700,
                    color: DS.hi, background: url.trim() ? DS.paper : "rgba(232,223,201,0.3)",
                    border: "none", padding: "0 12px", cursor: url.trim() ? "pointer" : "default" }}>
                  Load ↗
                </button>
              </div>
            </div>

            {/* divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0" }}>
              <div style={{ flex: 1, borderTop: "2px dotted rgba(38,48,42,0.3)" }} />
              <span style={{ fontFamily: DS.fMono, fontSize: 9, letterSpacing: 1.5, color: DS.muted }}>OR UPLOAD A FILE</span>
              <div style={{ flex: 1, borderTop: "2px dotted rgba(38,48,42,0.3)" }} />
            </div>

            {/* file upload */}
            <input ref={fileRef} type="file" accept=".ics,text/calendar"
              onChange={handleFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 13,
                padding: "14px", background: DS.paper, color: DS.ink,
                border: "1.5px solid rgba(38,48,42,0.35)", cursor: "pointer", textAlign: "left" }}>
              <div style={{ flex: "0 0 auto", width: 38, height: 38,
                border: "2px solid rgba(38,48,42,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: DS.fDisp, fontSize: 20, color: DS.hi }}>↑</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DS.fUi, fontSize: 14, fontWeight: 700 }}>Upload .ics file</div>
                <div style={{ fontFamily: DS.fMono, fontSize: 9.5, color: DS.muted, marginTop: 2 }}>
                  from Humans app, Apple Calendar, Google Calendar…
                </div>
              </div>
            </button>

            {/* error */}
            {phase === "error" && (
              errorMsg === "__humans__" ? (
                <div style={{ marginTop: 14, background: DS.paper, border: "1.5px solid " + DS.hi,
                  padding: "12px 14px", fontFamily: DS.fUi, fontSize: 12.5, color: DS.ink, lineHeight: 1.6 }}>
                  <div style={{ fontFamily: DS.fMono, fontSize: 10, letterSpacing: 1, color: DS.brown, marginBottom: 6 }}>
                    HOW TO GET THE FILE
                  </div>
                  <ol style={{ margin: "0 0 0 16px", padding: 0, fontFamily: DS.fUi, fontSize: 12.5, lineHeight: 1.8 }}>
                    <li>Open the link in your browser</li>
                    <li>The .ics file will download automatically</li>
                    <li>Come back here and tap <strong>Upload .ics file</strong> below</li>
                  </ol>
                  <a href={url.trim()} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 10,
                      fontFamily: DS.fUi, fontSize: 12, fontWeight: 700, color: DS.paper,
                      background: DS.hi, padding: "7px 12px", textDecoration: "none" }}>
                    Open link to download ↗
                  </a>
                </div>
              ) : (
                <div style={{ marginTop: 14, background: "#f9e8e4", border: "1.5px solid " + DS.accent,
                  padding: "10px 12px", fontFamily: DS.fUi, fontSize: 12.5, color: DS.accent, lineHeight: 1.5 }}>
                  {errorMsg}
                </div>
              )
            )}

            {/* hint */}
            <div style={{ marginTop: 16, background: DS.paper, border: "1px solid rgba(38,48,42,0.15)",
              padding: "8px 10px", fontFamily: DS.fMono, fontSize: 9.5, color: DS.muted, lineHeight: 1.8 }}>
              <span style={{ color: DS.ink, fontWeight: 700 }}>Humans app</span> → go to{" "}
              <a href="https://humans.nobodies.team/Shifts/Mine" target="_blank" rel="noopener noreferrer"
                style={{ color: DS.accent, textDecoration: "underline" }}>
                humans.nobodies.team/Shifts/Mine
              </a>{" "}→ copy the iCal feed link
              <br />
              <span style={{ color: DS.ink, fontWeight: 700 }}>Apple Calendar</span> → File → Export &nbsp;✶&nbsp;
              <span style={{ color: DS.ink, fontWeight: 700 }}>Google</span> → Settings → Export
            </div>
          </>)}

          {/* ── loading ── */}
          {phase === "loading" && (
            <div style={{ padding: "40px 0", textAlign: "center",
              fontFamily: DS.fDisp, fontSize: 18, color: DS.muted, letterSpacing: 1 }}>
              ✶ LOADING ✶
            </div>
          )}

          {/* ── preview ── */}
          {phase === "preview" && (<>
            <div style={{ marginBottom: 14, padding: "10px 12px",
              background: DS.hi, color: DS.paper, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DS.fDisp, fontSize: 16, lineHeight: 1 }}>
                  {newCount} new event{newCount !== 1 ? "s" : ""} found
                </div>
                <div style={{ fontFamily: DS.fMono, fontSize: 9.5, color: "rgba(232,223,201,0.7)", marginTop: 3 }}>
                  matched {matched.length} of {totalParsed} calendar entries
                  {alreadyCount > 0 ? ` · ${alreadyCount} already saved` : ""}
                </div>
              </div>
              <button onClick={handleConfirm} disabled={newCount === 0}
                style={{ flex: "0 0 auto", fontFamily: DS.fUi, fontSize: 12, fontWeight: 700,
                  color: DS.hi, background: DS.paper, border: "none",
                  padding: "8px 14px", cursor: newCount > 0 ? "pointer" : "default",
                  opacity: newCount > 0 ? 1 : 0.4 }}>
                Save {newCount > 0 ? newCount : ""} ♥
              </button>
            </div>

            {DAYS.filter((d) => matched.some((e) => e.days.includes(d))).map((day) => {
              const dayEvs = matched
                .filter((e) => e.days.includes(day))
                .sort((a, b) => {
                  const ta = (!a.time || a.time === "00:00") ? "99:99" : a.time;
                  const tb = (!b.time || b.time === "00:00") ? "99:99" : b.time;
                  return ta.localeCompare(tb);
                });
              return (
                <div key={day} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8,
                    borderBottom: "2px solid " + DS.ink, paddingBottom: 4, marginBottom: 7 }}>
                    <span style={{ fontFamily: DS.fDisp, fontSize: 15, color: DS.hi }}>{DAY_FULL[day].toUpperCase()}</span>
                    <span style={{ fontFamily: DS.fMono, fontSize: 9.5, color: DS.brown }}>✶ {DAY_DATES[day]}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayEvs.map((e) => {
                      const isNew = !saved.has(e.id);
                      return (
                        <div key={e.id}
                          style={{ display: "flex", alignItems: "center", gap: 8,
                            background: isNew ? DS.paper : "rgba(38,48,42,0.06)",
                            border: "1px solid rgba(38,48,42,0.18)",
                            padding: "7px 9px", opacity: isNew ? 1 : 0.55 }}>
                          <span style={{ fontFamily: DS.fDisp, fontSize: 13, color: catColor(e.cat),
                            flex: "0 0 38px", lineHeight: 1 }}>
                            {(!e.time || e.time === "00:00") ? "✶" : e.time}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: DS.fUi, fontWeight: 700, fontSize: 12.5, color: DS.ink,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                            <div style={{ fontFamily: DS.fMono, fontSize: 9.5, color: DS.muted }}>{e.camp}</div>
                          </div>
                          <span style={{ flex: "0 0 auto", fontFamily: DS.fUi, fontSize: 10, fontWeight: 700,
                            color: isNew ? DS.accent : DS.muted }}>
                            {isNew ? "♥ new" : "✓ saved"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>)}

          {/* ── done ── */}
          {phase === "done" && (
            <div style={{ padding: "40px 0", textAlign: "center",
              fontFamily: DS.fDisp, fontSize: 18, color: DS.accent, letterSpacing: 1 }}>
              ✶ IMPORTED ✶
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
