import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import ForgetPasswordModal from "./ForgetPasswordModal.jsx";

export default function AuthModal({ open, onClose }) {
  const { login, register, authLoading } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  if (!open) return null;

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
  if (mode === "login") {
    setSuccess("Login successful!");
  } else if (res.email?.success) {
    setSuccess(
      "Registration successful! Confirmation email has been sent to your Gmail."
    );
  } else {
    setSuccess(
      "Registration successful, but the confirmation email could not be sent."
    );
  }

  setTimeout(() => {
    onClose();
    setMode("login");
    setName("");
    setEmail("");
    setPassword("");
  }, 2000);
}

  const goHome = () => {
    onClose();
    navigate("/");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-brand">
          <span className="modal-brand-icon">🚂</span>
          <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
          <p>RailGaadi — live train tracking</p>
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
          <button className="btn auth-ghost" onClick={goHome}>
            🏠 Back to Home
          </button>
        </div>

        <ForgetPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      </motion.div>
    </div>
  );
}
}
