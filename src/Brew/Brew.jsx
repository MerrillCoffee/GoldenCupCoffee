export default function Brew() {
  return (
    <div className="brew-page">
      <div className="input-row">
        <label>Region of origin: </label>
        <input type="text" placeholder="e.g. Columbia" />
        
        <label>How much coffee? </label>
        <input type="text" placeholder="16 Oz" />
      </div>
      
      <div className="timer-section">
        <h3>Timer section:</h3>
        <p>Y Seconds</p>
        <p>Z Seconds</p>
      </div>
      
      <p>Let rest for L seconds, then enjoy!</p>
    </div>
  );
}