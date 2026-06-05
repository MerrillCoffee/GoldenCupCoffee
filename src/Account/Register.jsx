import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!username || !password || !confirmPassword) {
      setMessage("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage("Registration successful! Redirecting to login...");

        setUsername("");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          navigate("/account");
        }, 2000);
      } else {
        setMessage(data.error || "An error occurred during registration.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessage("Could not connect to the server.");
    }
  };

  return (
    <div className="register-container" style={{ padding: "20px", maxWidth: "400px", color: "#c9d1d9" }}>
      <h2 style={{ color: "#c9d1d9", marginBottom: "10px" }}>Create your Account</h2>
      <p style={{ color: "#8b949e", fontSize: "0.9em", marginBottom: "20px" }}>
        Join Golden Cup Coffee to keep track of your personal brewing configurations.
      </p>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "0.9em", fontWeight: "bold" }}>Username</label>
          <input 
            type="text" 
            placeholder="Choose a unique username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "8px", color: "#c9d1d9" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "0.9em", fontWeight: "bold" }}>Password</label>
          <input 
            type="password" 
            placeholder="Create a secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "8px", color: "#c9d1d9" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "0.9em", fontWeight: "bold" }}>Confirm Password</label>
          <input 
            type="password" 
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "8px", color: "#c9d1d9" }}
          />
        </div>

        <button 
          type="submit"
          style={{
            background: "#2ea043",
            color: "#ffffff",
            border: "1px solid rgba(240,246,252,0.1)",
            padding: "10px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            marginTop: "10px"
          }}
        >
          Sign Up
        </button>
      </form>

      {message && (
        <p style={{ color: isSuccess ? "#2ea043" : "#f85149", fontWeight: "bold", marginTop: "15px", fontSize: "0.95em" }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: "20px", fontSize: "0.9em", color: "#8b949e" }}>
        Already have an account?{" "}
        <span 
          onClick={() => navigate("/account")}
          style={{ color: "#58a6ff", cursor: "pointer", textDecoration: "underline" }}
        >
          Sign in here
        </span>
      </p>
    </div>
  );
}