import { useState } from "react";

// 1. Define James Hoffmann's precise instructions
const HOFFMANN_RECIPES = {
  "Drip Brew": {
    phase1: "Fill your water reservoir and insert your paper filter.",
    phase2: "Evenly distribute coffee grounds in the basket and start the machine.",
    rest: "Let the pot finish dripping entirely, swirl the carafe, and enjoy!"
  },
  "Pour Over": {
    phase1: "Wet filter. Add coffee. Bloom with double the coffee weight in water for 45 seconds (Swirl well!).",
    phase2: "Pour up to 60% total weight by 1:15, then up to 100% by 1:45. Give it a final gentle swirl.",
    rest: "Let draw down completely (aim for 3:00 - 3:30 total time), let cool slightly, then enjoy!"
  },
  "French Press": {
    phase1: "Pour boiling water over grounds. Let steep untouched for 4 minutes.",
    phase2: "Stir the crust on top so it sinks, scoop off the remaining floating white foam/oils, and wait.",
    rest: "Let rest for an additional 5 to 7 minutes! The sediment will drop to the bottom. Pour gently without pressing down completely!"
  },
  "Espresso": {
    phase1: "Distribute and tamp grounds perfectly flat. Lock portafilter in.",
    phase2: "Engage pump. Aim for a 1:2 yield ratio (e.g., 18g in, 36g out) extracting across 25 to 30 seconds.",
    rest: "Stir the espresso shots to combine the layers, let cool for 60 seconds, and enjoy!"
  },
  "Aeropress": {
    phase1: "Pour all water in. Insert the plunger slightly into the top to create a vacuum seal. Wait 2 minutes.",
    phase2: "Remove plunger, swirl the chamber gently, replace plunger, and wait 30 seconds.",
    rest: "Press down very gently and steadily, stopping right when you hear the hiss (~30 seconds)."
  },
  "Percolator": {
    phase1: "Fill the bottom chamber with cold water and place grounds into the top basket basket.",
    phase2: "Heat until boiling. Lower heat so it perks consistently every few seconds for 5 to 7 minutes.",
    rest: "Remove from heat, let the remaining water drain through the tube, and serve hot."
  },
  "Cold Brew": {
    phase1: "Combine coarse grounds and ambient water at a 1:8 ratio in a jar. Stir well to wet all grounds.",
    phase2: "Seal tightly and steep at room temperature or in the fridge for 12 to 18 hours.",
    rest: "Filter out the sludge using a fine mesh sieve or paper coffee filter. Dilute concentrate to taste!"
  }
};

export default function Brew() {
  const [region, setRegion] = useState("");
  const [coffeeAmount, setCoffeeAmount] = useState("");
  const [roastType, setRoastType] = useState("Medium");
  const [brewMethod, setBrewMethod] = useState("Drip Brew"); 
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // 2. Grab the specific recipe instructions based on the dropdown choice
  const currentRecipe = HOFFMANN_RECIPES[brewMethod];

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
          region,
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
    <div className="brew-page" style={{ padding: "20px" }}>
      <form onSubmit={handleSubmit} className="brew-form">
        <div className="input-row" style={{ display: "flex", gap: "15px", marginBottom: "25px", alignItems: "center", flexWrap: "wrap" }}>
          <label>Region of origin: </label>
          <input 
            type="text" 
            placeholder="e.g. Colombia" 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}
          />
          
          <label>How much coffee? </label>
          <input 
            type="text" 
            placeholder="16g" 
            value={coffeeAmount}
            onChange={(e) => setCoffeeAmount(e.target.value)}
            style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}
          />

          <label>Roast Type: </label>
          <select value={roastType} onChange={(e) => setRoastType(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
            <option value="Light">Light</option>
            <option value="Medium">Medium</option>
            <option value="Dark">Dark</option>
          </select>

          <label>Brew Method: </label>
          <select value={brewMethod} onChange={(e) => setBrewMethod(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
            <option value="Drip Brew">Drip Brew</option>
            <option value="Pour Over">Pour Over</option>
            <option value="Espresso">Espresso</option>
            <option value="French Press">French Press</option>
            <option value="Aeropress">Aeropress</option>
            <option value="Percolator">Percolator</option>
            <option value="Cold Brew">Cold Brew</option>
          </select>

          <button type="submit" className="nav-tab" style={{ cursor: "pointer", padding: "6px 12px", background: "#21262d", border: "1px solid #30363d", color: "#58a6ff", borderRadius: "6px" }}>
            Log Brew
          </button>
        </div>
      </form>

      {statusMessage && (
        <p className="status-banner" style={{ color: isError ? "#f85149" : "#2ea043", fontWeight: "bold", marginBottom: "20px" }}>
          {statusMessage}
        </p>
      )}
      
      {/* 3. DYNAMIC RECIPE VIEW SECTION */}
      <div className="timer-section" style={{ background: "#161b22", border: "1px solid #30363d", padding: "20px", borderRadius: "6px", marginTop: "10px" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#58a6ff" }}>
          Official Hoffmann Technique: <span style={{ color: "#c9d1d9" }}>{brewMethod}</span>
        </h3>
        
        <div style={{ marginBottom: "12px" }}>
          <strong style={{ color: "#8b949e" }}>Phase 1 (Preparation):</strong>
          <p style={{ margin: "5px 0 0 0", color: "#c9d1d9" }}>{currentRecipe.phase1}</p>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <strong style={{ color: "#8b949e" }}>Phase 2 (Extraction):</strong>
          <p style={{ margin: "5px 0 0 0", color: "#c9d1d9" }}>{currentRecipe.phase2}</p>
        </div>

        <div>
          <strong style={{ color: "#8b949e" }}>Final Step / Resting Time:</strong>
          <p style={{ margin: "5px 0 0 0", color: "#c9d1d9" }}>{currentRecipe.rest}</p>
        </div>
      </div>
    </div>
  );
}