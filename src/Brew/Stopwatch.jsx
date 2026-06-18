import React, { useState, useEffect, useRef } from "react";

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isActive && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTime(0);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ 
      background: "#0d1117", 
      border: "1px solid #30363d", 
      padding: "15px", 
      borderRadius: "6px", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <h4 style={{ margin: "0 0 5px 0", color: "#8b949e" }}>⏱️ Extraction Stopwatch</h4>
      <div style={{ fontSize: "3.2em", fontWeight: "bold", fontFamily: "monospace", color: isActive ? "#58a6ff" : "#c9d1d9", margin: "10px 0" }}>
        {formatTime(time)}
      </div>

      <div style={{ 
        display: "flex", 
        gap: "10px", 
        width: "100%", 
        flexWrap: "wrap", 
        justifyContent: "center" 
      }}>
        <button 
          onClick={toggleTimer}
          style={{ 
            background: isActive ? "#da3637" : "#2ea043", 
            color: "#ffffff", 
            border: "none", 
            padding: "8px 16px", 
            borderRadius: "6px", 
            fontWeight: "bold", 
            cursor: "pointer", 
            flex: "1", 
            minWidth: "80px" 
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
            cursor: "pointer", 
            flex: "1", 
            minWidth: "80px" 
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}