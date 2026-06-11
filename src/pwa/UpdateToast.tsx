// New-version toast. The service worker precaches everything (full offline),
// and when a fresh deploy is detected this offers a one-tap refresh.
import { useRegisterSW } from "virtual:pwa-register/react";
import { DS } from "../ds";

export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // re-check for updates hourly while the app stays open
      if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{ position: "absolute", left: 10, right: 10, top: "calc(36px + env(safe-area-inset-top))",
      zIndex: 60, background: DS.accent, color: DS.paper, border: "2px solid " + DS.ink,
      boxShadow: "2px 3px 0 rgba(38,48,42,0.35)", padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DS.fUi, fontSize: 13, fontWeight: 700 }}>Fresh program update ✶</div>
        <div style={{ fontFamily: DS.fMono, fontSize: 10, opacity: 0.85, marginTop: 1 }}>
          New events & fixes are ready.
        </div>
      </div>
      <button onClick={() => updateServiceWorker(true)} style={{ flex: "0 0 auto", fontFamily: DS.fUi,
        fontSize: 12, fontWeight: 700, background: DS.paper, color: DS.ink, border: "none",
        padding: "8px 12px", cursor: "pointer" }}>
        UPDATE
      </button>
      <span onClick={() => setNeedRefresh(false)} style={{ flex: "0 0 auto", cursor: "pointer",
        fontSize: 20, lineHeight: 1, opacity: 0.8 }}>×</span>
    </div>
  );
}
