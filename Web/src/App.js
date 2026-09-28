import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import orderingIcon from "./Images/orderingsystemicon.jpg";
import Dashboard from "./Components/dashboard/dashboard";
import MapViewer from "./Components/Map/MapViewer";
import ChatWidget from "./Components/ChatBot";
import { useAuth } from "./AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { properties } from './Properties/Properties';
/* =========================
   LOGIN PAGE
========================= */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // const response = await fetch("http://localhost:8080/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     username: email,
      //     password: password
      //   })
      // });

      const response = await fetch(properties.Port + properties.loginURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: password })
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(email, data.token);
      } else {
        const err = await response.text();
        setError(err || "Invalid credentials");
      }
    } catch (e) {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#1A3274",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          width: "420px",
          padding: "40px",
          backgroundColor: "#fff",
          borderRadius: "16px"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src={orderingIcon} alt="logo" width="60" />
          <h2>Spatial OMS</h2>
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        )}

        <input
          placeholder="Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
        />

        <div style={{ position: "relative", marginBottom: "20px" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px", paddingRight: "36px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280"
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px"
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </div>
    </div>
  );
}

/* =========================
   PROTECTED ROUTE
========================= */
function ProtectedRoute({ component: Component, isAuthenticated, ...rest }) {
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
}

/* =========================
   APP
========================= */
function App() {
  const { isAuthenticated, login, logout, user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: "#1A3274",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white"
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Router basename="/oms-backend">
      <Switch>

        {/* LOGIN */}
        <Route path="/login">
          {isAuthenticated ? (
            <Redirect to="/dashboard" />
          ) : (
            <LoginPage onLogin={login} />
          )}
        </Route>

        {/* DASHBOARD */}
        <ProtectedRoute
          path="/dashboard"
          isAuthenticated={isAuthenticated}
          component={() => (
            <Dashboard
              username={user}
              token={token}
              onLogout={logout}
            />
          )}
        />

        {/* ALL OTHER PROTECTED ROUTES */}
        <ProtectedRoute path="/orders" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/order/create" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/order/update" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/order/eye" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/order/history/:id?" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/notifications" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/barcode" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/aoi" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/users" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />
        <ProtectedRoute path="/prompt-management" isAuthenticated={isAuthenticated} component={() => <Dashboard username={user} token={token} onLogout={logout} />} />

        {/* Map viewer (open AOI in new tab) - public route so it opens without login */}
        <Route path="/map-view">
          <MapViewer />
        </Route>

        {/* DEFAULT */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>

      </Switch>
      
      {/* Chatbot Widget - Only available to authenticated users */}
      {isAuthenticated && <ChatWidget />}
    </Router>
  );
}

export default App;
