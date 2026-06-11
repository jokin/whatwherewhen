import { useState, useMemo } from "react";
import { DS, DAYS } from "../ds";
import { events } from "../data";
import { Phone, StatusBar, AdmitStrip, StubCard, Nav } from "../components/ui";
import { EventSheet } from "../sheets/EventSheet";
import { CalendarExportSheet } from "../sheets/CalendarExportSheet";
import type { Event, TabName } from "../types";

export function MineView({ saved, onSave, onTabChange }: {
  saved: Set<string>; onSave: (id: string) => void; onTabChange: (t: TabName) => void;
}) {
  const [sheet, setSheet] = useState<Event | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const savedEvents = useMemo(() =>
    events.filter((e) => saved.has(e.id))
      .sort((a, b) => DAYS.indexOf(a.days[0] as typeof DAYS[number]) - DAYS.indexOf(b.days[0] as typeof DAYS[number])), [saved]);

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
          {savedEvents.length > 0 && (
            <button onClick={() => setExportOpen(true)} style={{
              flex: "0 0 auto", marginTop: 4,
              fontFamily: DS.fUi, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              color: DS.paper, background: DS.hi,
              border: "none", padding: "6px 10px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 13 }}>◈</span> EXPORT
            </button>
          )}
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
              {savedEvents.map((e, i) => (
                <StubCard key={e.id} event={e} index={i} saved onSelect={setSheet} onSave={onSave} />
              ))}
            </div>
            <div style={{ height: 12 }}></div>
          </div>
        )
      }
      <Nav active="Mine" onChange={onTabChange} />
      {sheet && <EventSheet event={sheet} saved={saved.has(sheet.id)} onClose={() => setSheet(null)} onSave={onSave} />}
      {exportOpen && <CalendarExportSheet events={savedEvents} onClose={() => setExportOpen(false)} />}
    </Phone>
  );
}
