import React from 'react';

export default function BrewCalculator({ measurements, brewMethod, methodRatio }) {
  if (!measurements) return null;

  return (
    <div style={{ background: "#0d1117", border: "1px solid #2ea043", padding: "15px", borderRadius: "6px", height: "100%" }}>
      <h4 style={{ margin: "0 0 10px 0", color: "#2ea043" }}>📐 Custom Scaling Calculator Output</h4>
      <p style={{ margin: "5px 0", color: "#c9d1d9" }}>
        To make your targeted <strong style={{ color: "#58a6ff" }}>{measurements.unitUsed}</strong> using a <strong style={{ color: "#79c0ff" }}>1:{methodRatio}</strong> target ratio:
      </p>
      <ul style={{ color: "#c9d1d9", paddingLeft: "20px", margin: "5px 0" }}>
        <li>Weigh out exactly <strong style={{ color: "#ff79c6", fontSize: "1.1em" }}>{measurements.coffee} grams</strong> of coffee beans.</li>
        
        {brewMethod === "Espresso" ? (
          <li>Aim to extract exactly <strong style={{ color: "#58a6ff", fontSize: "1.1em" }}>{measurements.water} grams</strong> of liquid espresso into your cup.</li>
        ) : brewMethod === "Cold Brew" ? (
          <li>Use exactly <strong style={{ color: "#58a6ff", fontSize: "1.1em" }}>{measurements.water} grams (ml)</strong> of room temperature or cold water.</li>
        ) : (
          <li>Heat up exactly <strong style={{ color: "#58a6ff", fontSize: "1.1em" }}>{measurements.water} grams (ml)</strong> of water.</li>
        )}
        
        {brewMethod === "Pour Over" && (
          <li>Your initial 45-second bloom stage requires pouring exactly <strong style={{ color: "#58a6ff" }}>{measurements.bloom}g</strong> of water.</li>
        )}
      </ul>
    </div>
  );
}