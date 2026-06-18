import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { FaCoffee, FaClipboardList, FaBookOpen, FaGlobe, FaUserCircle } from "react-icons/fa";

import Account from "./Account/Account";
import Brew from "./Brew/Brew";
import Logs from "./Logs/Logs";
import Register from "./Account/Register";
import Login from "./Account/Login";
import Social from './Social/Social';
import Learning from './Learn/Learning';
// Import other components as needed

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <BrowserRouter>
        <div className="app-container">
            <nav className="nav-header">
                <Link to="/brew" className="nav-tab"><FaCoffee /> Brew</Link>
                <Link to="/logs" className="nav-tab"><FaClipboardList /> Logs</Link>
                <Link to="/learning" className="nav-tab"><FaBookOpen /> Learning</Link>
                <Link to="/social" className="nav-tab"><FaGlobe /> Social</Link>
                <Link to="/account" className="nav-tab"><FaUserCircle /> Account</Link>
            </nav>

            <main className="content-area">
                <Routes>
                    <Route path="/brew" element={<Brew />} />
                    <Route path="/logs" element={<Logs />}/>
                    <Route path="/learning" element={<Learning />} />
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