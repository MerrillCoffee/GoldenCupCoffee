import React, { useState } from "react";
import BrewCalculator from "./BrewCalculator";
import Stopwatch from "./Stopwatch";
import HoffmannGuide from "./HoffmannGuide";

const METHOD_RATIOS = {
  "Drip Brew": 16.67, "Pour Over": 16.67, "French Press": 16.67,
  "Espresso": 2, "Aeropress": 11, "Percolator": 15, "Cold Brew": 8
};

const COMMON_ORIGINS = [
  "Brazil", "Colombia", "Ethiopia", "Guatemala", "Honduras", 
  "Kenya", "Mexico", "Peru", "Sumatra (Indonesia)", "Uganda", "Vietnam"
];

export default function Brew() {
  const [roastery, setRoastery] = useState(""); 
  const [selectedRegion, setSelectedRegion] = useState("Colombia"); 
  const [customRegion, setCustomRegion] = useState(""); 
  const [targetVolume, setTargetVolume] = useState(12); 
  const [roastType, setRoastType] = useState("Medium");
  const [brewMethod, setBrewMethod] = useState("Drip Brew"); 
  const [espressoShots, setEspressoShots] = useState(2);
  const [waterTemp, setWaterTemp] = useState(""); 
  const [grindSize, setGrindSize] = useState("Medium");

  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const calculateMeasurements = () => {
    if (brewMethod === "Espresso") {
      const coffeeGrams = espressoShots === 1 ? 9 : 18;
      const liquidYield = coffeeGrams * METHOD_RATIOS["Espresso"];
      return { water: liquidYield, coffee: coffeeGrams, bloom: 0, unitUsed: espressoShots === 1 ? "Single Shot" : "Double Shot" };
    }

    const numericVolume = parseFloat(targetVolume);
    if (isNaN(numericVolume) || numericVolume <= 0) return null;

    const ratio = METHOD_RATIOS[brewMethod];
    const waterMl = Math.round(numericVolume * 29.57); 
    const coffeeGrams = (waterMl / ratio).toFixed(1);
    const bloomWater = Math.round(coffeeGrams * 2);

    return { water: waterMl, coffee: coffeeGrams, bloom: bloomWater, unitUsed: `${numericVolume} oz` };
  };

  const measurements = calculateMeasurements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsError(false);

    const finalRegion = selectedRegion === "Other" ? customRegion.trim() : selectedRegion;
    if (!finalRegion) return setIsError(true) || setStatusMessage("Please specify the region of your coffee beans!");

    const token = localStorage.getItem("token");
    if (!token) return setIsError(true) || setStatusMessage("Please log in via the Account tab before logging a brew.");

    const formattedCoffeeAmount = measurements ? `${measurements.coffee}g` : `${targetVolume} oz`;

    try {
      const response = await fetch("/api/brews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          roastery: roastery.trim() || "Unknown Roastery",
          region: finalRegion,
          coffee_amount: formattedCoffeeAmount, 
          roast_type: roastType,
          brew_method: brewMethod,
          water_temp: waterTemp.trim() || null,
          grind_size: grindSize
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(`Successfully logged your ${data.brew_method} from ${data.region}! ☕`);
        setCustomRegion("");
        setRoastery(""); 
        setWaterTemp("");
      } else {
        setIsError(true);
        setStatusMessage(data.error || "Failed to save brew log.");
      }
    } catch (error) {
      setIsError(true);
      setStatusMessage("An error occurred while connecting to the server.");
    }
  };

  return (
    <div className="brew-page" style={{ padding: "20px" }}>
      
      <form onSubmit={handleSubmit} className="brew-form" style={{ background: "#161b22", padding: "20px", borderRadius: "6px", border: "1px solid #30363d", marginBottom: "25px" }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#8b949e", fontWeight: "bold" }}>Roaster:</label>
            <input type="text" placeholder="e.g. Onyx" value={roastery} onChange={(e) => setRoastery(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "120px" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#8b949e", fontWeight: "bold" }}>Region:</label>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
              {COMMON_ORIGINS.map((origin) => (<option key={origin} value={origin}>{origin}</option>))}
              <option value="Other">Other...</option>
            </select>
            {selectedRegion === "Other" && (
              <input type="text" placeholder="Enter custom region" value={customRegion} onChange={(e) => setCustomRegion(e.target.value)} style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }} />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#8b949e", fontWeight: "bold" }}>Method:</label>
            <select value={brewMethod} onChange={(e) => setBrewMethod(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
              {Object.keys(METHOD_RATIOS).map(method => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>

          {brewMethod === "Espresso" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ color: "#8b949e", fontWeight: "bold" }}>Size:</label>
              <select value={espressoShots} onChange={(e) => setEspressoShots(parseInt(e.target.value))} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
                <option value={1}>Single Shot</option>
                <option value={2}>Double Shot</option>
              </select>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "110px", display: "inline-block" }}>
                <label style={{ color: "#8b949e", fontWeight: "bold" }}>Volume: <strong style={{ color: "#58a6ff" }}>{targetVolume} oz</strong></label>
              </div>
              <input type="range" min="4" max="80" step="1" value={targetVolume} onChange={(e) => setTargetVolume(e.target.value)} style={{ cursor: "pointer", accentColor: "#2ea043", width: "150px" }} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#8b949e", fontWeight: "bold" }}>Grind:</label>
            <select value={grindSize} onChange={(e) => setGrindSize(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
              {["Extra Fine", "Fine", "Medium-Fine", "Medium", "Medium-Coarse", "Coarse", "Extra Coarse"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#8b949e", fontWeight: "bold" }}>Temp:</label>
            <input type="text" placeholder="e.g. 200°F" value={waterTemp} onChange={(e) => setWaterTemp(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px", width: "90px" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#8b949e", fontWeight: "bold" }}>Roast:</label>
            <select value={roastType} onChange={(e) => setRoastType(e.target.value)} style={{ background: "#0d1117", border: "1px solid #30363d", padding: "6px", color: "#c9d1d9", borderRadius: "4px" }}>
              <option value="Light">Light</option>
              <option value="Medium">Medium</option>
              <option value="Dark">Dark</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #30363d" }}>
          <button type="submit" style={{ cursor: "pointer", padding: "8px 24px", background: "#238636", border: "none", color: "#ffffff", borderRadius: "6px", fontWeight: "bold" }}>Log Brew</button>
        </div>
      </form>

      {statusMessage && <p style={{ color: isError ? "#f85149" : "#2ea043", fontWeight: "bold", marginBottom: "20px" }}>{statusMessage}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "25px" }}>
        <BrewCalculator measurements={measurements} brewMethod={brewMethod} methodRatio={METHOD_RATIOS[brewMethod]} />
        <Stopwatch />
      </div>
      
      <HoffmannGuide brewMethod={brewMethod} roastType={roastType} measurements={measurements} />
    </div>
  );
}