import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === "") return;
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUsername("");
    setIsLoggedIn(false);
  };

  return (
    <div className="app-container">
      {!isLoggedIn ? (
        <div className="login-page">
          <h1 className="title">Gradeify</h1>
          <p className="subtitle">Track your grades and stay on top of your classes!</p>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input type="password" placeholder="Password" />
            <button type="submit">Log In</button>
          </form>
        </div>
      ) : (
        <div className="dashboard">
          <h1>Welcome, {username}!</h1>
          <p>Your dashboard will appear here.</p>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}
    </div>
  );
}
