import { useState, useEffect } from "react";

const METHOD_RATIOS = {
  "Drip Brew": 16.67, "Pour Over": 16.67, "French Press": 16.67,
  "Espresso": 2, "Aeropress": 11, "Percolator": 15, "Cold Brew": 8
};

export default function Logs() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editRegion, setEditRegion] = useState("");
  const [editRoastery, setEditRoastery] = useState("");
  const [editRoastType, setEditRoastType] = useState("Medium");
  const [editWaterTemp, setEditWaterTemp] = useState("");
  const [editGrindSize, setEditGrindSize] = useState("Medium");

  const [sharingId, setSharingId] = useState(null);
  const [shareBlurb, setShareBlurb] = useState("");

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
        if (data.length < 10) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (pageNumber === 1) {
          setHistory(data); 
        } else {
          setHistory(prev => [...prev, ...data]); 
        }
      } else {
        setError(data.error || "Failed to load coffee history.");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
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
    const waterMl = grams * ratio;
    const fluidOunces = Math.round(waterMl / 29.57);
    return `${fluidOunces} oz cup (${grams}g dry)`;
  };

  const handleDelete = async (brew) => {
    const isSaved = brew.is_saved_recipe;
    const actionText = isSaved ? "unsave this recipe from your logs" : "permanently delete this brew log";
    
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    
    const token = localStorage.getItem("token");

    try {
      let response;
      if (isSaved) {
        response = await fetch(`/api/social/brews/${brew.id}/save`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } else {
        response = await fetch(`/api/brews/${brew.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }

      if (response.ok) {
        setHistory(history.filter(b => b.id !== brew.id));
      } else {
        alert(`Failed to ${isSaved ? "unsave" : "delete"} the log.`);
      }
    } catch (err) {
      console.error(`Error ${isSaved ? "unsaving" : "deleting"} brew:`, err);
    }
  };

  const handleCopy = async (brew) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/brews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          roastery: brew.roastery,
          region: `${brew.region} (Copy)`,
          coffee_amount: brew.coffee_amount,
          roast_type: brew.roast_type,
          brew_method: brew.brew_method,
          water_temp: brew.water_temp,
          grind_size: brew.grind_size
        })
      });

      if (response.ok) {
        setPage(1);
        fetchLogs(1);
      } else {
        alert("Failed to duplicate log.");
      }
    } catch (err) {
      console.error("Error copying log:", err);
    }
  };

  const startShare = (brew) => {
    setSharingId(brew.id);
    setShareBlurb("");
    setEditingId(null); 
  };

  const handleShare = async (brewId) => {
    if (!shareBlurb.trim()) {
      alert("Please add a short blurb before sharing!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/brews/${brewId}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blurb: shareBlurb })
      });

      if (response.ok) {
        setSharingId(null);
        setShareBlurb("");
        alert("Successfully shared to the community feed!");
        setHistory(prevHistory => prevHistory.map(b => 
          b.id === brewId ? { ...b, is_public: true } : b
        ));
      } else {
        alert("Failed to share brew.");
      }
    } catch (err) {
      console.error("Error sharing brew:", err);
    }
  };

  const startEdit = (brew) => {
    setEditingId(brew.id);
    setEditRegion(brew.region);
    setEditRoastery(brew.roastery || "");
    setEditRoastType(brew.roast_type);
    setEditWaterTemp(brew.water_temp || "");
    setEditGrindSize(brew.grind_size || "Medium");
    setSharingId(null); 
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/brews/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          roastery: editRoastery,
          region: editRegion,
          roast_type: editRoastType,
          water_temp: editWaterTemp,
          grind_size: editGrindSize 
        })
      });

      if (response.ok) {
        setEditingId(null);
        setPage(1);
        fetchLogs(1);
      } else {
        alert("Failed to update log.");
      }
    } catch (err) {
      console.error("Error updating log:", err);
    }
  };

  if (loading && page === 1) return <p style={{ color: "#8b949e", padding: "20px" }}>Warming up the kettle...</p>;
  if (error) return <p style={{ color: "#f85149", padding: "20px" }}>{error}</p>;

  return (
    <div className="logs-page" style={{ padding: "20px", maxWidth: "800px" }}>
      <h2 style={{ color: "#c9d1d9", borderBottom: "1px solid #30363d", paddingBottom: "10px" }}>
        Your Personal Brew Logs
      </h2>

      {history.length === 0 ? (
        <p style={{ color: "#8b949e", marginTop: "20px" }}>No brews logged on this account yet.</p>
      ) : (
        <div className="logs-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          {history.map((brew) => (
            <div 
              key={`${brew.id}-${brew.is_saved_recipe}`}
              className="log-card" 
              style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}
            >
              
              <div style={{ width: '100%' }}>
                {brew.is_saved_recipe ? (
                  <div className="log-origin-badge" style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '8px' }}>
                    🔄 Saved from <span style={{ color: '#58a6ff', fontWeight: 'bold' }}>@{brew.author}</span>
                  </div>
                ) : (
                  <div className="log-origin-badge" style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '8px' }}>
                    📝 Your Original Brew
                  </div>
                )}
              </div>

              {/* --- EDIT MODE --- */}
              {editingId === brew.id ? (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", width: "100%" }}>
                  <input type="text" placeholder="Roastery" value={editRoastery} onChange={(e) => setEditRoastery(e.target.value)} style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "120px" }} />
                  <input type="text" placeholder="Region" value={editRegion} onChange={(e) => setEditRegion(e.target.value)} style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "120px" }} />
                  
                  <select value={editGrindSize} onChange={(e) => setEditGrindSize(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
                    <option value="Extra Fine">Extra Fine</option>
                    <option value="Fine">Fine</option>
                    <option value="Medium-Fine">Medium-Fine</option>
                    <option value="Medium">Medium</option>
                    <option value="Medium-Coarse">Medium-Coarse</option>
                    <option value="Coarse">Coarse</option>
                    <option value="Extra Coarse">Extra Coarse</option>
                  </select>

                  <input type="text" placeholder="Temp (e.g. 200°F)" value={editWaterTemp} onChange={(e) => setEditWaterTemp(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "90px" }} />

                  <select value={editRoastType} onChange={(e) => setEditRoastType(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Dark">Dark</option>
                  </select>

                  <button onClick={() => handleUpdate(brew.id)} style={{ padding: "6px 12px", background: "#2ea043", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ padding: "6px 12px", background: "#21262d", border: "1px solid #30363d", color: "#c9d1d9", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
                
                /* --- DISPLAY MODE --- */
                <div style={{ width: sharingId === brew.id ? '100%' : 'auto' }}>
                  <h3 style={{ margin: "0 0 5px 0", color: "#58a6ff" }}>
                    {brew.roastery && `${brew.roastery} `}{brew.region} — <span style={{ color: "#8b949e", fontSize: "0.9em", fontWeight: "normal" }}>{brew.brew_method}</span>
                  </h3>
                  <p style={{ margin: "0", color: "#c9d1d9", fontSize: "0.95em" }}>
                    Liquid Output: <strong style={{ color: "#2ea043" }}>{getLiquidOutput(brew.coffee_amount, brew.brew_method)}</strong> | 
                    Roast: <span style={{ color: "#79c0ff" }}>{brew.roast_type}</span>
                    {brew.grind_size && <span> | Grind: <span style={{ color: "#d2a8ff" }}>{brew.grind_size}</span></span>}
                    {brew.water_temp && <span> | Temp: <span style={{ color: "#ff7b72" }}>{brew.water_temp.replace(/Â/g, ' ')}</span></span>}
                  </p>
                </div>
              )}

              {sharingId === brew.id && (
                <div style={{ width: "100%", marginTop: "10px", borderTop: "1px solid #30363d", paddingTop: "12px" }}>
                  <label style={{ display: "block", color: "#3fb950", fontWeight: "bold", marginBottom: "8px", fontSize: "0.9em" }}>🌍 Share to Community</label>
                  <textarea
                    placeholder="Add a short blurb about this brew..."
                    value={shareBlurb}
                    onChange={(e) => setShareBlurb(e.target.value)}
                    style={{ boxSizing: "border-box", width: "100%", background: "#0d1117", color: "#c9d1d9", border: "1px solid #30363d", padding: "10px", borderRadius: "4px", minHeight: "60px", resize: "vertical", marginBottom: "8px" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleShare(brew.id)} style={{ padding: "6px 12px", background: "#238636", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85em" }}>Post to Feed</button>
                    <button onClick={() => setSharingId(null)} style={{ padding: "6px 12px", background: "#21262d", border: "1px solid #30363d", color: "#c9d1d9", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "12px", width: sharingId === brew.id ? '100%' : 'auto' }}>
                {editingId !== brew.id && sharingId !== brew.id && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    
                    {!brew.is_saved_recipe && (
                      <button onClick={() => startEdit(brew)} style={{ background: "#21262d", color: "#58a6ff", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>✏️ Edit</button>
                    )}

                    {!brew.is_saved_recipe && !brew.is_public && (
                      <button onClick={() => startShare(brew)} style={{ background: "#21262d", color: "#3fb950", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>🌍 Share</button>
                    )}

                    {brew.is_public && (
                      <span style={{ fontSize: "0.85em", color: "#8b949e", alignSelf: "center", padding: "0 4px" }}>🌍 Shared</span>
                    )}
                    
                    <button onClick={() => handleCopy(brew)} style={{ background: "#21262d", color: "#79c0ff", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>📋 Copy</button>
                    
                    <button onClick={() => handleDelete(brew)} style={{ background: "#21262d", color: brew.is_saved_recipe ? "#d2a8ff" : "#f85149", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>
                      {brew.is_saved_recipe ? "🔖 Unsave" : "🗑️ Delete"}
                    </button>
                  </div>
                )}
                {sharingId !== brew.id && (
                  <div style={{ fontSize: "0.85em", color: "#8b949e", marginLeft: "auto" }}>
                    {new Date(brew.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {hasMore && history.length > 0 && (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <button 
            onClick={() => setPage(prev => prev + 1)}
            style={{ padding: '10px 20px', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
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