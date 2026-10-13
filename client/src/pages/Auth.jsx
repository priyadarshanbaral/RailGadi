import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import RegistrationSuccess from "../components/RegistrationSuccess.jsx";

// Dedicated authentication page — supports both login and register modes
// (controlled via ?mode=login|register). Register validates confirmPassword
// and triggers the backend to generate a User ID + send the welcome email.
export default function Auth() {
  const { login, register, authLoading, user } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [registeredUser, setRegisteredUser] = useState(null);

  // Already logged in → go to dashboard
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!name.trim()) return setError("Please enter your full name.");
      if (!/^\S+@\S+\.\S+$/.test(email.trim()))
        return setError("Please enter a valid email address.");
      if (password.length < 4)
        return setError("Password must be at least 4 characters.");
      if (password !== confirm) return setError("Passwords do not match.");

const res = await register(name, email, password, confirm);
      if (res.ok) {
        setRegisteredUser({ ...res.user, emailStatus: res.email });
      } else {
        setError(res.error || "Registration failed. Please try again.");
      }
    } else {
      if (!email.trim() || !password.trim())
        return setError("Please fill in both email and password.");
      const res = await login(email, password);
      if (res.ok) {
        navigate("/dashboard");
      } else {
        setError(res.error || "Login failed. Please try again.");
      }
    }
  };

  if (registeredUser) {
    return (
      <div className="auth-page">
        <RegistrationSuccess user={registeredUser} />
      </div>
    );
  }

  return (
    <div className="auth-page fade-in-up">
      <motion.div
        className="glass-card login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="login-brand">
          <img src="https://cdn-icons-png.flaticon.com/128/1034/1034693.png" alt="RailGaadi" className="login-brand-icon" />
          <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
          <p>
            {mode === "login"
              ? "Login to access your RailGaadi dashboard"
              : "Register to get a unique User ID & welcome email"}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {mode === "register" && (
            <div className="form-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create RailGaadi Account"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <span>
              Don't have an account?{" "}
              <button className="auth-link" onClick={() => setMode("register")}>
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button className="auth-link" onClick={() => setMode("login")}>
                Login
              </button>
            </span>
          )}
        </div>

        <div className="auth-footer">
          <button 
            type="button" 
            className="btn btn-secondary back-home-btn" 
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
