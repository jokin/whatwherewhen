// Add-to-homescreen prompt. Android/Chrome: captures `beforeinstallprompt` and
// shows a banner that triggers the native install dialog. iOS Safari has no
// install API, so we show Share → Add to Home Screen instructions instead.
import { useState, useEffect } from "react";
import { DS } from "../ds";

const DISMISS_KEY = "elsewhere-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS
}

export function InstallPrompt() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => {
    if (isStandalone()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (isIOS()) setShowIOS(true);
    const onInstalled = () => { setInstallEvt(null); setShowIOS(false); };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    if (outcome === "accepted") setInstallEvt(null);
    else dismiss();
  };

  if (dismissed || isStandalone() || (!installEvt && !showIOS)) return null;

  return (
    <div style={{ position: "absolute", left: 10, right: 10, bottom: "calc(72px + env(safe-area-inset-bottom))",
      zIndex: 40, background: DS.hi, color: DS.paper, border: "2px solid " + DS.ink,
      boxShadow: "2px 3px 0 rgba(38,48,42,0.35)", padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontFamily: DS.fDisp, fontSize: 22, flex: "0 0 auto" }}>✶</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DS.fUi, fontSize: 13.5, fontWeight: 700 }}>
          Take the guide off-grid
        </div>
        <div style={{ fontFamily: DS.fMono, fontSize: 10.5, opacity: 0.85, marginTop: 2, lineHeight: 1.4 }}>
          {installEvt
            ? "Install it on your home screen — works with no signal in the desert."
            : <>Tap <span style={{ fontWeight: 700 }}>Share ⎋</span> then <span style={{ fontWeight: 700 }}>Add to Home Screen ⊞</span> — works with no signal in the desert.</>}
        </div>
      </div>
      {installEvt && (
        <button onClick={install} style={{ flex: "0 0 auto", fontFamily: DS.fUi, fontSize: 12, fontWeight: 700,
          background: DS.accent, color: DS.paper, border: "none", padding: "8px 12px", cursor: "pointer" }}>
          INSTALL
        </button>
      )}
      <span onClick={dismiss} style={{ flex: "0 0 auto", cursor: "pointer", fontSize: 20, lineHeight: 1, opacity: 0.7 }}>×</span>
    </div>
  );
}
