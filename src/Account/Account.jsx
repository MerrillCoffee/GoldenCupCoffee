import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const API_URL = "https://your-api-url.com/api";

export default function Account ({ token }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) {
            async function fetchUserAccount() {
                try {
                    const response = await fetch(`${API_URL}/users/me`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });
                    const result = await response.json()
                    setUser(result.user || result);
                } catch (error) {
                    console.error("Error fetching account:", error);
                }
            }
            fetchUserAccount();
        }
    }, [token]);

    if(!token) {
        return (
            <div className="account-container">
                <h2>Account Profile</h2>
                <p>Please log in or register to view account details!</p>
                <div className="account-links">
                    <Link to="/login">Log In</Link>
                    <Link to="/register">Register for an Account</Link>
                </div>
            </div>
        );
    }
};