import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import ForgetPasswordModal from "../components/ForgetPasswordModal.jsx";

export default function Login() {
  const { login, register, authLoading, user } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  // If already logged in, go to home which now shows full details
  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const res =
      mode === "login"
        ? await login(email, password)
        : await register(name, email, password);

    if (res.ok) {
      setSuccess(mode === "login" ? "Login successful!" : "Registration successful!");
      setTimeout(() => {
        navigate("/");
      }, 900);
    } else {
      setError(res.error || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="login-page fade-in-up">
      <motion.div
        className="glass-card login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="login-brand">
          <span className="login-brand-icon">🚂</span>
          <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
          <p>RailGaadi — Login to access live train tracking & details</p>
        </div>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
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

          <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Register"}
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

        {/* Forgot password + Back to home */}
        <div className="auth-actions">
          <button className="btn auth-ghost" onClick={() => setForgotOpen(true)}>
            🔑 Forgot Password
          </button>
          <Link to="/" className="btn auth-ghost">
            🏠 Back to Home
          </Link>
        </div>

        <ForgetPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      </motion.div>
    </div>
  );
}
