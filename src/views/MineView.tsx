import { useState, useMemo } from "react";
import { DS, DAYS, DAY_FULL, DAY_DATES } from "../ds";
import { events } from "../data";
import { Phone, StatusBar, AdmitStrip, StubCard, Nav } from "../components/ui";
import { EventSheet } from "../sheets/EventSheet";
import { CalendarExportSheet } from "../sheets/CalendarExportSheet";
import { CalendarImportSheet } from "../sheets/CalendarImportSheet";
import type { Event, TabName } from "../types";

export function MineView({ saved, onSave, onTabChange }: {
  saved: Set<string>; onSave: (id: string) => void; onTabChange: (t: TabName) => void;
}) {
  const [sheet, setSheet] = useState<Event | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleImport = (ids: string[]) => {
    for (const id of ids) if (!saved.has(id)) onSave(id);
  };
  const savedEvents = useMemo(() =>
    events.filter((e) => saved.has(e.id))
      .sort((a, b) => DAYS.indexOf(a.days[0] as typeof DAYS[number]) - DAYS.indexOf(b.days[0] as typeof DAYS[number])), [saved]);

  // Group saved events by first day
  const byDay = useMemo(() => {
    const groups: { day: string; evs: typeof savedEvents; startIndex: number }[] = [];
    let idx = 0;
    for (const day of DAYS) {
      const evs = savedEvents.filter((e) => e.days[0] === day);
      if (evs.length) { groups.push({ day, evs, startIndex: idx }); idx += evs.length; }
    }
    return groups;
  }, [savedEvents]);

  return (
    <Phone>
      <StatusBar />
      <AdmitStrip />
      <div style={{ padding: "4px 18px 8px 50px", flex: "0 0 auto", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontFamily: DS.fDisp, fontSize: 29.4, lineHeight: 0.95, color: DS.hi }}>MY SCHEDULE</div>
            <div style={{ fontFamily: DS.fUi, fontSize: 12.4, color: DS.brown, marginTop: 3 }}>
              {savedEvents.length} saved · tap to view
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flex: "0 0 auto" }}>
            <button onClick={() => setImportOpen(true)}
              style={{ fontFamily: DS.fUi, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                color: DS.hi, background: "transparent",
                border: "1.5px solid " + DS.hi, padding: "6px 10px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>↑</span> IMPORT
            </button>
            {savedEvents.length > 0 && (
              <button onClick={() => setExportOpen(true)}
                style={{ fontFamily: DS.fUi, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  color: DS.paper, background: DS.hi,
                  border: "none", padding: "6px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 13 }}>◈</span> EXPORT
              </button>
            )}
          </div>
        </div>
      </div>
      {savedEvents.length === 0
        ? (
          <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
            <div style={{ fontSize: 36.2 }}>♡</div>
            <div style={{ fontFamily: DS.fUi, fontSize: 14.7, color: DS.muted, textAlign: "center", lineHeight: 1.5 }}>
              Nothing saved yet.<br />Tap ♡ on any event to add it here.
            </div>
          </div>
        )
        : (
          <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "0 18px 16px 50px" }}>
            <div className="stub-grid">
              {byDay.map(({ day, evs, startIndex }) => (
                <>
                  <div key={"h-" + day} className="grid-full"
                    style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "14px 0 6px",
                      borderBottom: "2px solid " + DS.ink, marginBottom: 2 }}>
                    <span style={{ fontFamily: DS.fDisp, fontSize: 21, color: DS.hi, letterSpacing: 0.3, lineHeight: 1 }}>{DAY_FULL[day].toUpperCase()}</span>
                    <span style={{ fontFamily: DS.fMono, fontSize: 11, color: DS.muted }}>{evs.length} saved</span>
                    <span style={{ marginLeft: "auto", fontFamily: DS.fMono, fontSize: 10.5, color: DS.brown, letterSpacing: 1 }}>✶ {DAY_DATES[day]}</span>
                  </div>
                  {evs.map((e, i) => (
                    <StubCard key={e.id} event={e} index={startIndex + i} saved onSelect={setSheet} onSave={onSave} />
                  ))}
                </>
              ))}
            </div>
            <div style={{ height: 12 }}></div>
          </div>
        )
      }
      <Nav active="Mine" onChange={onTabChange} />
      {sheet && <EventSheet event={sheet} saved={saved.has(sheet.id)} onClose={() => setSheet(null)} onSave={onSave} />}
      {exportOpen && <CalendarExportSheet events={savedEvents} onClose={() => setExportOpen(false)} />}
      {importOpen && <CalendarImportSheet saved={saved} onClose={() => setImportOpen(false)} onImport={handleImport} />}
    </Phone>
  );
}
