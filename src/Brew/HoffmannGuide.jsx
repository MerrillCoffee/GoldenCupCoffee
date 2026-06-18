import React from 'react';

export default function HoffmannGuide({ brewMethod, roastType, measurements }) {
  const getInstructions = () => {
    const w = measurements ? measurements.water : "[water]";
    const c = measurements ? measurements.coffee : "[coffee]";
    const b = measurements ? measurements.bloom : "[bloom]";
    
    const w60 = measurements ? Math.round(measurements.water * 0.6) : "[60% water]";
    const ey = measurements ? Math.round(measurements.coffee * 2) : "[yield]";

    switch (brewMethod) {
      case "Pour Over": return { phase1: `Wet the paper filter with hot water. Add ${c}g of coffee. Bloom with ${b}g of water for 45 seconds (Swirl well!).`, phase2: `Pour up to ${w60}g total weight by 1:15, then up to the full ${w}g by 1:45. Give it a final gentle swirl.`, rest: "Let draw down completely (aim for 3:00 - 3:30 total time), let cool slightly, then enjoy!" };
      case "French Press": return { phase1: `Add ${c}g of coarse coffee, then pour ${w}g of water over the grounds. Let steep untouched for 4 minutes.`, phase2: "Stir the crust on top so it sinks, scoop off the remaining floating white foam/oils, and wait.", rest: "Let rest for an additional 5 to 7 minutes! The sediment will drop to the bottom. Pour gently without pressing down completely!" };
      case "Espresso": return { phase1: `Distribute and tamp ${c}g of fine grounds perfectly flat. Lock portafilter in.`, phase2: `Engage pump. Aim for a 1:2 yield ratio (extracting ~${ey}g of liquid espresso) across 25 to 30 seconds.`, rest: "Stir the espresso shots to combine the layers, let cool for 60 seconds, and enjoy!" };
      case "Aeropress": return { phase1: `Add ${c}g of coffee, then pour all ${w}g of water in. Insert the plunger slightly into the top to create a vacuum seal. Wait 2 minutes.`, phase2: "Remove plunger, swirl the chamber gently, replace plunger, and wait 30 seconds.", rest: "Press down very gently and steadily, stopping right when you hear the hiss (~30 seconds)." };
      case "Percolator": return { phase1: `Fill the bottom chamber with ${w}g of cold water and place ${c}g of coarse grounds into the top basket.`, phase2: "Heat until boiling. Lower heat so it perks consistently every few seconds for 5 to 7 minutes.", rest: "Remove from heat, let the remaining water drain through the tube, and serve hot." };
      case "Cold Brew": return { phase1: `Combine ${c}g of coarse grounds and ${w}g of ambient water. Stir well to wet all grounds.`, phase2: "Seal tightly and steep at room temperature or in the fridge for 12 to 18 hours.", rest: "Filter out the sludge using a fine mesh sieve or paper coffee filter. Dilute concentrate to taste!" };
      case "Drip Brew": default: return { phase1: `Fill your water reservoir with ${w}g (ml) of water and insert your paper filter.`, phase2: `Evenly distribute ${c}g of coffee grounds in the basket and start the machine.`, rest: "Let the pot finish dripping entirely, swirl the carafe, and enjoy!" };
    }
  };

  const instructions = getInstructions();

  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", padding: "20px", borderRadius: "6px" }}>
      <h3 style={{ margin: "0 0 15px 0", color: "#58a6ff" }}>
        Official Hoffmann Technique: <span style={{ color: "#c9d1d9" }}>{brewMethod}</span>
      </h3>

      <div style={{ marginBottom: "15px", padding: "10px", background: "#0d1117", borderRadius: "4px", borderLeft: "4px solid #d2a8ff" }}>
        <strong style={{ color: "#d2a8ff" }}>🌡️ Optimal Water Temp: </strong>
        {brewMethod === "Cold Brew" ? (
           <span style={{ color: "#c9d1d9" }}>Ambient or Cold Filtered Water</span>
        ) : (
          <>
            <span style={{ color: "#c9d1d9" }}>93°C - 96°C (199.4°F - 204.8°F)</span>
            {roastType === "Dark" && <span style={{ color: "#8b949e", fontSize: "0.85em", display: "block", marginTop: "4px" }}>*Tip: For dark roasts, try leaning closer to 90°C (194°F) to avoid extracting bitter flavors.</span>}
            {roastType === "Light" && <span style={{ color: "#8b949e", fontSize: "0.85em", display: "block", marginTop: "4px" }}>*Tip: For light roasts, you can even push closer to boiling to maximize extraction!</span>}
          </>
        )}
      </div>

      <div>
        <strong style={{ color: "#8b949e" }}>Phase 1 (Preparation):</strong>
        <p style={{ margin: "5px 0 12px 0", color: "#c9d1d9" }}>{instructions.phase1}</p>
      </div>
      <div>
        <strong style={{ color: "#8b949e" }}>Phase 2 (Extraction):</strong>
        <p style={{ margin: "5px 0 12px 0", color: "#c9d1d9" }}>{instructions.phase2}</p>
      </div>
      <div>
        <strong style={{ color: "#8b949e" }}>Final Step / Resting Time:</strong>
        <p style={{ margin: "5px 0 0 0", color: "#c9d1d9" }}>{instructions.rest}</p>
      </div>
    </div>
  );
}