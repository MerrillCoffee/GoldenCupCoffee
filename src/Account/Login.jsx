import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!username || !password) {
      setMessage("Please enter both a username and password.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        setMessage(`Welcome back, ${data.username}! ☕`);

        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(data.error || "Invalid username or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Could not connect to the server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.reload();
  };

  const loggedInUser = localStorage.getItem("username");

  if (loggedInUser) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", color: "#c9d1d9" }}>
        <h2>Account Settings</h2>
        <p>Currently signed in as: <strong style={{ color: "#58a6ff" }}>{loggedInUser}</strong></p>
        <button 
          onClick={handleLogout}
          style={{
            background: "#21262d",
            color: "#f85149",
            border: "1px solid #30363d",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", color: "#c9d1d9" }}>
      <h2>Sign In to Golden Cup</h2>
      
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "8px", color: "#c9d1d9" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          Login
        </button>
      </form>

      <p style={{ marginTop: "20px", fontSize: "0.9em", color: "#8b949e" }}>
        New to Golden Cup Coffee?{" "}
        <span 
          onClick={() => navigate("/account/register")}
          style={{ color: "#58a6ff", cursor: "pointer", textDecoration: "underline" }}
        >
          Create an account
        </span>
      </p>

      {message && (
        <p style={{ color: isSuccess ? "#2ea043" : "#f85149", fontWeight: "bold", marginTop: "15px" }}>
          {message}
        </p>
      )}
    </div>
  );
}