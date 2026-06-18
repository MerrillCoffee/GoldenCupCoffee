import React, { useState } from "react";

export default function LogCard({ brew, getLiquidOutput, onUpdate, onDelete, onCopy, onShare }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareBlurb, setShareBlurb] = useState("");

  const [editForm, setEditForm] = useState({
    roastery: brew.roastery || "",
    region: brew.region || "",
    roast_type: brew.roast_type || "Medium",
    water_temp: brew.water_temp || "",
    grind_size: brew.grind_size || "Medium"
  });

  const handleSaveEdit = async () => {
    const success = await onUpdate(brew.id, editForm);
    if (success) setIsEditing(false);
  };

  const handleShareSubmit = async () => {
    if (!shareBlurb.trim()) return alert("Please add a short blurb before sharing!");
    const success = await onShare(brew.id, shareBlurb);
    if (success) {
      setIsSharing(false);
      setShareBlurb("");
    }
  };

  return (
    <div className="log-card" style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
      
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

      {isEditing ? (
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", width: "100%" }}>
          <input type="text" placeholder="Roastery" value={editForm.roastery} onChange={(e) => setEditForm({...editForm, roastery: e.target.value})} style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "120px" }} />
          <input type="text" placeholder="Region" value={editForm.region} onChange={(e) => setEditForm({...editForm, region: e.target.value})} style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "120px" }} />
          
          <select value={editForm.grind_size} onChange={(e) => setEditForm({...editForm, grind_size: e.target.value})} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
            <option value="Extra Fine">Extra Fine</option>
            <option value="Fine">Fine</option>
            <option value="Medium-Fine">Medium-Fine</option>
            <option value="Medium">Medium</option>
            <option value="Medium-Coarse">Medium-Coarse</option>
            <option value="Coarse">Coarse</option>
            <option value="Extra Coarse">Extra Coarse</option>
          </select>

          <input type="text" placeholder="Temp (e.g. 200°F)" value={editForm.water_temp} onChange={(e) => setEditForm({...editForm, water_temp: e.target.value})} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "90px" }} />

          <select value={editForm.roast_type} onChange={(e) => setEditForm({...editForm, roast_type: e.target.value})} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
            <option value="Light">Light</option>
            <option value="Medium">Medium</option>
            <option value="Dark">Dark</option>
          </select>

          <button onClick={handleSaveEdit} style={{ padding: "6px 12px", background: "#2ea043", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer" }}>Save</button>
          <button onClick={() => setIsEditing(false)} style={{ padding: "6px 12px", background: "#21262d", border: "1px solid #30363d", color: "#c9d1d9", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
        </div>
      ) : (
        <div style={{ width: isSharing ? '100%' : 'auto' }}>
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

      {isSharing && (
        <div style={{ width: "100%", marginTop: "10px", borderTop: "1px solid #30363d", paddingTop: "12px" }}>
          <label style={{ display: "block", color: "#3fb950", fontWeight: "bold", marginBottom: "8px", fontSize: "0.9em" }}>🌍 Share to Community</label>
          <textarea
            placeholder="Add a short blurb about this brew..."
            value={shareBlurb}
            onChange={(e) => setShareBlurb(e.target.value)}
            style={{ boxSizing: "border-box", width: "100%", background: "#0d1117", color: "#c9d1d9", border: "1px solid #30363d", padding: "10px", borderRadius: "4px", minHeight: "60px", resize: "vertical", marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleShareSubmit} style={{ padding: "6px 12px", background: "#238636", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85em" }}>Post to Feed</button>
            <button onClick={() => setIsSharing(false)} style={{ padding: "6px 12px", background: "#21262d", border: "1px solid #30363d", color: "#c9d1d9", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", width: isSharing ? '100%' : 'auto' }}>
        {!isEditing && !isSharing && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {!brew.is_saved_recipe && (
              <button onClick={() => setIsEditing(true)} style={{ background: "#21262d", color: "#58a6ff", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>✏️ Edit</button>
            )}
            {!brew.is_saved_recipe && !brew.is_public && (
              <button onClick={() => setIsSharing(true)} style={{ background: "#21262d", color: "#3fb950", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>🌍 Share</button>
            )}
            {brew.is_public && (
              <span style={{ fontSize: "0.85em", color: "#8b949e", alignSelf: "center", padding: "0 4px" }}>🌍 Shared</span>
            )}
            <button onClick={() => onCopy(brew)} style={{ background: "#21262d", color: "#79c0ff", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>📋 Copy</button>
            <button onClick={() => onDelete(brew)} style={{ background: "#21262d", color: brew.is_saved_recipe ? "#d2a8ff" : "#f85149", border: "1px solid #30363d", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85em" }}>
              {brew.is_saved_recipe ? "🔖 Unsave" : "🗑️ Delete"}
            </button>
          </div>
        )}
        {!isSharing && (
          <div style={{ fontSize: "0.85em", color: "#8b949e", marginLeft: "auto" }}>
            {new Date(brew.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

    </div>
  );
}