import { useState, useEffect, useRef } from "react";

const HOFFMANN_RECIPES = {
  "Drip Brew": { ratio: 16.67, phase1: "Fill your water reservoir and insert your paper filter.", phase2: "Evenly distribute coffee grounds in the basket and start the machine.", rest: "Let the pot finish dripping entirely, swirl the carafe, and enjoy!" },
  "Pour Over": { ratio: 16.67, phase1: "Wet filter. Add coffee. Bloom with double the coffee weight in water for 45 seconds (Swirl well!).", phase2: "Pour up to 60% total weight by 1:15, then up to 100% by 1:45. Give it a final gentle swirl.", rest: "Let draw down completely (aim for 3:00 - 3:30 total time), let cool slightly, then enjoy!" },
  "French Press": { ratio: 16.67, phase1: "Pour boiling water over grounds. Let steep untouched for 4 minutes.", phase2: "Stir the crust on top so it sinks, scoop off the remaining floating white foam/oils, and wait.", rest: "Let rest for an additional 5 to 7 minutes! The sediment will drop to the bottom. Pour gently without pressing down completely!" },
  "Espresso": { ratio: 2, phase1: "Distribute and tamp grounds perfectly flat. Lock portafilter in.", phase2: "Engage pump. Aim for a 1:2 yield ratio extracting across 25 to 30 seconds.", rest: "Stir the espresso shots to combine the layers, let cool for 60 seconds, and enjoy!" },
  "Aeropress": { ratio: 11, phase1: "Pour all water in. Insert the plunger slightly into the top to create a vacuum seal. Wait 2 minutes.", phase2: "Remove plunger, swirl the chamber gently, replace plunger, and wait 30 seconds.", rest: "Press down very gently and steadily, stopping right when you hear the hiss (~30 seconds)." },
  "Percolator": { ratio: 15, phase1: "Fill the bottom chamber with cold water and place grounds into the top basket.", phase2: "Heat until boiling. Lower heat so it perks consistently every few seconds for 5 to 7 minutes.", rest: "Remove from heat, let the remaining water drain through the tube, and serve hot." },
  "Cold Brew": { ratio: 8, phase1: "Combine coarse grounds and ambient water. Stir well to wet all grounds.", phase2: "Seal tightly and steep at room temperature or in the fridge for 12 to 18 hours.", rest: "Filter out the sludge using a fine mesh sieve or paper coffee filter. Dilute concentrate to taste!" }
};

const COMMON_ORIGINS = [
  "Brazil", "Colombia", "Ethiopia", "Guatemala", 
  "Honduras", "Kenya", "Mexico", "Peru", 
  "Sumatra (Indonesia)", "Uganda", "Vietnam"
];

export default function Brew() {
  const [selectedRegion, setSelectedRegion] = useState("Colombia"); 
  const [customRegion, setCustomRegion] = useState(""); 
  const [targetVolume, setTargetVolume] = useState(12); 
  const [roastType, setRoastType] = useState("Medium");
  const [brewMethod, setBrewMethod] = useState("Drip Brew"); 
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // --- Timer States ---
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  const currentRecipe = HOFFMANN_RECIPES[brewMethod];

  // --- Timer Logic ---
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isActive && timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTime(0);
  };

  // Helper to turn numbers into clean 00:00 strings
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // --- Calculation Engine ---
  const calculateMeasurements = () => {
    const numericVolume = parseFloat(targetVolume);
    if (isNaN(numericVolume) || numericVolume <= 0) return null;

    const waterMl = Math.round(numericVolume * 29.57); 
    const coffeeGrams = (waterMl / currentRecipe.ratio).toFixed(1);
    const bloomWater = Math.round(coffeeGrams * 2);

    return {
      water: waterMl,
      coffee: coffeeGrams,
      bloom: bloomWater,
      unitUsed: `${numericVolume} oz`
    };
  };

  const measurements = calculateMeasurements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsError(false);

    const finalRegion = selectedRegion === "Other" ? customRegion.trim() : selectedRegion;

    if (!finalRegion) {
      setIsError(true);
      setStatusMessage("Please specify the region of your coffee beans!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setIsError(true);
      setStatusMessage("Please log in via the Account tab before logging a brew.");
      return;
    }

    const formattedCoffeeAmount = measurements ? `${measurements.coffee}g` : `${targetVolume} oz`;

    try {
      const response = await fetch("/api/brews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          region: finalRegion,
          coffee_amount: formattedCoffeeAmount, 
          roast_type: roastType,
          brew_method: brewMethod
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(`Successfully logged your ${data.brew_method} from ${data.region}! ☕`);
        setCustomRegion("");
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
        <div style={{ display: "flex", gap: "20px", marginBottom: "25px", alignItems: "center", flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label>Region: </label>
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)} 
              style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}
            >
              {COMMON_ORIGINS.map((origin) => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
              <option value="Other">Other...</option>
            </select>

            {selectedRegion === "Other" && (
              <input 
                type="text" 
                placeholder="Enter custom region" 
                value={customRegion}
                onChange={(e) => setCustomRegion(e.target.value)}
                style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}
              />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "110px", display: "inline-block" }}>
              <label>Volume: <strong style={{ color: "#58a6ff" }}>{targetVolume} oz</strong></label>
            </div>
            <input 
              type="range" min="4" max="80" step="1" value={targetVolume}
              onChange={(e) => setTargetVolume(e.target.value)}
              style={{ cursor: "pointer", accentColor: "#2ea043", width: "150px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label>Roast: </label>
            <select value={roastType} onChange={(e) => setRoastType(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
              <option value="Medium">Medium</option>
              <option value="Light">Light</option>
              <option value="Dark">Dark</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label>Method: </label>
            <select value={brewMethod} onChange={(e) => setBrewMethod(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
              <option value="Drip Brew">Drip Brew</option>
              <option value="Pour Over">Pour Over</option>
              <option value="Espresso">Espresso</option>
              <option value="French Press">French Press</option>
              <option value="Aeropress">Aeropress</option>
              <option value="Percolator">Percolator</option>
              <option value="Cold Brew">Cold Brew</option>
            </select>
          </div>

          <button type="submit" style={{ cursor: "pointer", padding: "6px 12px", background: "#21262d", border: "1px solid #30363d", color: "#58a6ff", borderRadius: "6px" }}>
            Log Brew
          </button>
        </div>
      </form>

      {statusMessage && (
        <p style={{ color: isError ? "#f85149" : "#2ea043", fontWeight: "bold", marginBottom: "20px" }}>
          {statusMessage}
        </p>
      )}

      {/* Calculator left Timer Right */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "25px" }}>
        
        {/* calc component */}
        {measurements && (
          <div style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "15px", borderRadius: "6px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#2ea043" }}>📐 Custom Scaling Calculator Output</h4>
            <p style={{ margin: "5px 0", color: "#c9d1d9" }}>
              To make your targeted <strong style={{ color: "#58a6ff" }}>{measurements.unitUsed}</strong> cup using a <strong style={{ color: "#79c0ff" }}>1:{currentRecipe.ratio}</strong> target ratio:
            </p>
            <ul style={{ color: "#c9d1d9", paddingLeft: "20px", margin: "5px 0" }}>
              <li>Weigh out exactly <strong style={{ color: "#ff79c6", fontSize: "1.1em" }}>{measurements.coffee} grams</strong> of coffee beans.</li>
              <li>Heat up exactly <strong style={{ color: "#58a6ff", fontSize: "1.1em" }}>{measurements.water} grams (ml)</strong> of water.</li>
              {brewMethod === "Pour Over" && (
                <li>Your initial 45-second bloom stage requires pouring exactly <strong style={{ color: "#58a6ff" }}>{measurements.bloom}g</strong> of water.</li>
              )}
            </ul>
          </div>
        )}

        {/* Stopwatch Timer */}
        <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: "15px", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h4 style={{ margin: "0 0 5px 0", color: "#8b949e" }}>⏱️ Extraction Stopwatch</h4>
          <div style={{ fontSize: "3.2em", fontWeight: "bold", fontFamily: "monospace", color: isActive ? "#58a6ff" : "#c9d1d9", margin: "10px 0" }}>
            {formatTime(time)}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={toggleTimer}
              style={{
                background: isActive ? "#da3637" : "#2ea043", // Alternates red/green depending on tracking status
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "80px"
              }}
            >
              {isActive ? "Stop" : "Start"}
            </button>
            <button 
              onClick={resetTimer}
              style={{
                background: "#21262d",
                color: "#c9d1d9",
                border: "1px solid #30363d",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* method instructions */}
      <div style={{ background: "#161b22", border: "1px solid #30363d", padding: "20px", borderRadius: "6px" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#58a6ff" }}>
          Official Hoffmann Technique: <span style={{ color: "#c9d1d9" }}>{brewMethod}</span>
        </h3>
        <div>
          <strong style={{ color: "#8b949e" }}>Phase 1 (Preparation):</strong>
          <p style={{ margin: "5px 0 12px 0", color: "#c9d1d9" }}>{currentRecipe.phase1}</p>
        </div>
        <div>
          <strong style={{ color: "#8b949e" }}>Phase 2 (Extraction):</strong>
          <p style={{ margin: "5px 0 12px 0", color: "#c9d1d9" }}>{currentRecipe.phase2}</p>
        </div>
        <div>
          <strong style={{ color: "#8b949e" }}>Final Step / Resting Time:</strong>
          <p style={{ margin: "5px 0 0 0", color: "#c9d1d9" }}>{currentRecipe.rest}</p>
        </div>
      </div>
    </div>
  );
}