import { useState } from "react";

export default function Brew() {
  const [region, setRegion] = useState("");
  const [coffeeAmount, setCoffeeAmount] = useState("");
  const [roastType, setRoastType] = useState("Medium");
  const [brewMethod, setBrewMethod] = useState("Drip Brew"); 
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsError(false);

    if (!region || !coffeeAmount) {
      setIsError(true);
      setStatusMessage("Please fill out both the region and coffee amount!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setIsError(true);
      setStatusMessage("Please log in via the Account tab before logging a brew.");
      return;
    }

    try {
      const response = await fetch("/api/brews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          region: region,
          coffee_amount: coffeeAmount,
          roast_type: roastType,
          brew_method: brewMethod, 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(`Successfully logged your ${data.brew_method} from ${data.region}! ☕`);
        setRegion("");
        setCoffeeAmount("");
      } else {
        setIsError(true);
        setStatusMessage(data.error || "Failed to save brew log.");
      }
    } catch (error) {
      console.error("Error submitting brew log:", error);
      setIsError(true);
      setStatusMessage("An error occurred while connecting to the server.");
    }
  };

  return (
    <div className="brew-page">
      <form onSubmit={handleSubmit} className="brew-form">
        <div className="input-row" style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "center", flexWrap: "wrap" }}>
          <label>Region of origin: </label>
          <input 
            type="text" 
            placeholder="e.g. Colombia" 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
          
          <label>How much coffee? </label>
          <input 
            type="text" 
            placeholder="16 Oz" 
            value={coffeeAmount}
            onChange={(e) => setCoffeeAmount(e.target.value)}
          />

          <label>Roast Type: </label>
          <select value={roastType} onChange={(e) => setRoastType(e.target.value)}>
            <option value="Light">Light</option>
            <option value="Medium">Medium</option>
            <option value="Dark">Dark</option>
          </select>

          <label>Brew Method: </label>
          <select value={brewMethod} onChange={(e) => setBrewMethod(e.target.value)}>
            <option value="Drip Brew">Drip Brew</option>
            <option value="Pour Over">Pour Over</option>
            <option value="Espresso">Espresso</option>
            <option value="French Press">French Press</option>
            <option value="Aeropress">Aeropress</option>
            <option value="Percolator">Percolator</option>
            <option value="Cold Brew">Cold Brew</option>
          </select>

          <button type="submit" className="nav-tab" style={{ cursor: "pointer", borderBottom: "1px solid #30363d" }}>
            Log Brew
          </button>
        </div>
      </form>

      {statusMessage && (
        <p className="status-banner" style={{ color: isError ? "#f85149" : "#2ea043", fontWeight: "bold" }}>
          {statusMessage}
        </p>
      )}
      
      <div className="timer-section">
        <h3>Timer section:</h3>
        <p>Y Seconds</p>
        <p>Z Seconds</p>
      </div>
      
      <p>Let rest for L seconds, then enjoy!</p>
    </div>
  );
}