import { useState } from "react";
import "./App.css";

function App() {
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
    <div className="app">
      {!isLoggedIn ? (
        // -------- FRONT PAGE (login) --------
        <div className="login-page">
          <h1 className="title">Gradeify</h1>
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
        // -------- DASHBOARD --------
        <div className="dashboard">
          <h1>Welcome, {username}!</h1>
          <p>This is your dashboard. Grades will appear here later.</p>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}
    </div>
  );
}

export default App;
