import { useState, useEffect } from "react";

export default function Logs() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in under the Account tab to view your personal logs.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/brews", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setHistory(data);
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

    fetchLogs();
  }, []);

  if (loading) return <p style={{ color: "#8b949e", padding: "20px" }}>Warming up the kettle...</p>;
  if (error) return <p style={{ color: "#f85149", padding: "20px" }}>{error}</p>;

  return (
    <div className="logs-page" style={{ padding: "20px", maxWidth: "800px" }}>
      <h2 style={{ color: "#c9d1d9", borderBottom: "1px solid #30363d", paddingBottom: "10px" }}>
        Your Personal Brew Logs
      </h2>

      {history.length === 0 ? (
        <p style={{ color: "#8b949e", marginTop: "20px" }}>No brews logged on this account yet. Go pull some shots!</p>
      ) : (
        <div className="logs-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          {history.map((brew) => (
            <div 
              key={brew.id} 
              className="log-card" 
              style={{
                background: "#161b22", 
                border: "1px solid #30363d", 
                borderRadius: "6px", 
                padding: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 5px 0", color: "#58a6ff" }}>
                  {brew.region} — <span style={{ color: "#8b949e", fontSize: "0.9em", fontWeight: "normal" }}>{brew.brew_method}</span>
                </h3>
                <p style={{ margin: "0", color: "#c9d1d9", fontSize: "0.95em" }}>
                  Ratio/Amount: <strong>{brew.coffee_amount}</strong> | Roast: <span style={{ color: "#79c0ff" }}>{brew.roast_type}</span>
                </p>
              </div>
              <div style={{ textAlign: "right", fontSize: "0.85em", color: "#8b949e" }}>
                {new Date(brew.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}