import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Account from "./account/account";
import Brew from "./Brew/Brew";
import Logs from "./Logs/Logs";
import Register from "./account/Register";
import Login from "./account/Login";
import Social from './Social/Social';
// Import other components as needed

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <BrowserRouter>
        <div className="app-container">
            <nav className="nav-header">
                <Link to="/brew" className="nav-tab">Brew</Link>
                <Link to="/logs" className="nav-tab">Logs</Link>
                <Link to="/learning" className="nav-tab">Learning</Link>
                <Link to="/social" className="nav-tab">Social</Link>
                <Link to="/account" className="nav-tab">Account</Link>
            </nav>

            <main className="content-area">
                <Routes>
                    <Route path="/brew" element={<Brew />} />
                    <Route path="/logs" element={<Logs />}/>
                    <Route path="/learning" element={<div>Learning Page Content</div>} />
                    <Route path="/social" element={<Social />} />
                    <Route path="/account" element={<Login />} />
                    <Route path="/account/register" element={<Register />} />
                    <Route path="/" element={<div>Welcome to Golden Cup! Click a tab to start.</div>} />
                </Routes>
            </main>
        </div>
    </BrowserRouter>
  );
};