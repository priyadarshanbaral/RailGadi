import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import ForgetPasswordModal from "../components/ForgetPasswordModal.jsx";
import PhoneOtpLogin from "../components/PhoneOtpLogin.jsx";

export default function Login() {
  const { login, authLoading, user } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);

  // If already logged in, go to home which now shows full details
  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const res = await login(email, password);

    if (res.ok) {
      setSuccess("Login successful!");
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
          <h1>Welcome Back</h1>
          <p>RailGaadi — Login to access live train tracking & details</p>
        </div>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        {phoneLoginOpen ? (
          <PhoneOtpLogin
            onSuccess={() => navigate("/")}
            onCancel={() => setPhoneLoginOpen(false)}
          />
        ) : (
        <>
        <form onSubmit={handleSubmit} className="auth-form">
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
            {authLoading ? "Please wait..." : "Login"}
          </button>
        </form>
        <button
          type="button"
          className="auth-link"
          onClick={() => setPhoneLoginOpen(true)}
        >
          Login with mobile number
        </button>
        </>
        )}

        <div className="auth-switch">
          <span>
            Don't have an account?{" "}
            <button className="auth-link" onClick={() => navigate("/auth?mode=register")}>
              Register with email verification
            </button>
          </span>
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
