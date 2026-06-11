/* global React, ReactDOM, DS, BrowseView, MapView, MineView */
(function () {
  const { useState, useCallback, useEffect } = React;
  const SAVE_KEY = "elsewhere-saved-2026";

  function App() {
    const [tab, setTab]   = useState("Browse");
    const [saved, setSaved] = useState(() => {
      try { return new Set(JSON.parse(localStorage.getItem(SAVE_KEY)||"[]")); }
      catch { return new Set(); }
    });
    const [searchQuery, setSearchQuery] = useState("");

    const handleSave = useCallback(id => {
      setSaved(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        localStorage.setItem(SAVE_KEY, JSON.stringify([...next]));
        return next;
      });
    }, []);

    const handleTab = useCallback(name => { setTab(name); }, []);

    return (
      <div className="app-shell">
        <div className="phone-frame">
          {tab === "Browse" && <BrowseView saved={saved} onSave={handleSave} onTabChange={handleTab} initialSearch={searchQuery} />}
          {tab === "Map"    && <MapView    saved={saved} onSave={handleSave} onTabChange={handleTab} />}
          {tab === "Mine"   && <MineView   saved={saved} onSave={handleSave} onTabChange={handleTab} />}
        </div>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
