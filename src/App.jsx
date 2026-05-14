import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Account from "./Account/account";
import Brew from "./Brew/Brew";
import Logs from "./Logs/Logs";
import Learning from "./Learn/Learning";
import Social from "./Social/Social";

export default function App() {
    const [token, setToken] = useState(null);

    return (
        <BrowserRouter>
            <div className="app-container">
                <nav className="tabs-nav">
                    <Link to="/brew" className="tab">Brew</Link>
                    <Link to="/logs" className="tab">Logs</Link>
                    <Link to="/learning" className="tab">Learning</Link>
                    <Link to="/badges" className="tab">Badges</Link>
                    <Link to="/social" className="tab">Social</Link>
                    <Link to="/account" className="tab">Account</Link>
                </nav>

            <main>
                <Routes>
                    <Route path="/brew" element={<Brew />} />
                    <Route path="/logs" element={<Logs />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/social" element={<Social />} />
                    <Route path="/account" element={<Account token={token} />} />
                    <Route path="/" element={<Brew />} />
                </Routes>
            </main>
        </div>
    </BrowserRouter>
  );
}