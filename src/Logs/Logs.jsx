import React, { useState, useEffect } from "react";
import LogCard from "./LogCard";

const METHOD_RATIOS = {
  "Drip Brew": 16.67, "Pour Over": 16.67, "French Press": 16.67,
  "Espresso": 2, "Aeropress": 11, "Percolator": 15, "Cold Brew": 8
};

export default function Logs() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (pageNumber = 1) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in under the Account tab to view your personal logs.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/brews?page=${pageNumber}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data.length < 10) setHasMore(false);
        else setHasMore(true);

        if (pageNumber === 1) setHistory(data); 
        else setHistory(prev => [...prev, ...data]); 
      } else {
        setError(data.error || "Failed to load coffee history.");
      }
    } catch (err) {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const getLiquidOutput = (coffeeAmountStr, brewMethod) => {
    const str = String(coffeeAmountStr).toLowerCase();
    if (str.includes('oz')) return str;
    const grams = parseFloat(str);
    if (isNaN(grams)) return coffeeAmountStr;
    const ratio = METHOD_RATIOS[brewMethod] || 16.67;
    const fluidOunces = Math.round((grams * ratio) / 29.57);
    return `${fluidOunces} oz cup (${grams}g dry)`;
  };

  const handleUpdate = async (id, editData) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/brews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setPage(1);
        fetchLogs(1);
        return true; 
      }
      alert("Failed to update log.");
      return false;
    } catch (err) { console.error("Error updating:", err); return false; }
  };

  const handleShare = async (brewId, shareBlurb) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/brews/${brewId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ blurb: shareBlurb })
      });
      if (response.ok) {
        alert("Successfully shared to the community feed!");
        setHistory(prev => prev.map(b => b.id === brewId ? { ...b, is_public: true } : b));
        return true;
      }
      alert("Failed to share brew.");
      return false;
    } catch (err) { console.error("Error sharing:", err); return false; }
  };

  const handleDelete = async (brew) => {
    const isSaved = brew.is_saved_recipe;
    const actionText = isSaved ? "unsave this recipe from your logs" : "permanently delete this brew log";
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    
    const token = localStorage.getItem("token");
    try {
      let response;
      if (isSaved) {
        response = await fetch(`/api/social/brews/${brew.id}/save`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      } else {
        response = await fetch(`/api/brews/${brew.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      }

      if (response.ok) {
        setHistory(history.filter(b => b.id !== brew.id));
      } else alert(`Failed to ${isSaved ? "unsave" : "delete"} the log.`);
    } catch (err) { console.error("Error deleting:", err); }
  };

  const handleCopy = async (brew) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/brews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          roastery: brew.roastery, region: `${brew.region} (Copy)`, coffee_amount: brew.coffee_amount,
          roast_type: brew.roast_type, brew_method: brew.brew_method, water_temp: brew.water_temp, grind_size: brew.grind_size
        })
      });
      if (response.ok) {
        setPage(1);
        fetchLogs(1);
      } else alert("Failed to duplicate log.");
    } catch (err) { console.error("Error copying:", err); }
  };

  if (loading && page === 1) return <p style={{ color: "#8b949e", padding: "20px" }}>Warming up the kettle...</p>;
  if (error) return <p style={{ color: "#f85149", padding: "20px" }}>{error}</p>;

  return (
    <div className="logs-page" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ color: "#c9d1d9", borderBottom: "1px solid #30363d", paddingBottom: "10px" }}>
        Your Personal Brew Logs
      </h2>

      {history.length === 0 ? (
        <p style={{ color: "#8b949e", marginTop: "20px" }}>No brews logged on this account yet.</p>
      ) : (
        <div className="logs-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          {history.map((brew) => (
            <LogCard 
              key={`${brew.id}-${brew.is_saved_recipe}`} 
              brew={brew} 
              getLiquidOutput={getLiquidOutput}
              onUpdate={handleUpdate}
              onShare={handleShare}
              onDelete={handleDelete}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {hasMore && history.length > 0 && (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <button onClick={() => setPage(prev => prev + 1)} style={{ padding: '10px 20px', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Load Older Logs 👇
          </button>
        </div>
      )}
      
      {!hasMore && history.length > 0 && (
        <p style={{ textAlign: 'center', color: '#8b949e', marginTop: '30px', fontStyle: 'italic' }}>
          That's all the brews in your history!
        </p>
      )}
    </div>
  );
}