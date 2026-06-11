import { useState, useCallback } from "react";
import { BrowseView } from "./views/BrowseView";
import { MapView } from "./views/MapView";
import { MineView } from "./views/MineView";
import { InstallPrompt } from "./pwa/InstallPrompt";
import type { TabName } from "./types";

const SAVE_KEY = "elsewhere-saved-2026";

export default function App() {
  const [tab, setTab] = useState<TabName>("Browse");
  const [saved, setSaved] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SAVE_KEY) || "[]")); }
    catch { return new Set(); }
  });

  const handleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(SAVE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleTab = useCallback((name: TabName) => setTab(name), []);

  return (
    <div className="app-shell">
      <div className="phone-frame">
        {tab === "Browse" && <BrowseView saved={saved} onSave={handleSave} onTabChange={handleTab} />}
        {tab === "Map" && <MapView saved={saved} onSave={handleSave} onTabChange={handleTab} />}
        {tab === "Mine" && <MineView saved={saved} onSave={handleSave} onTabChange={handleTab} />}
        <InstallPrompt />
      </div>
    </div>
  );
}
