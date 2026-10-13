import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import RegistrationSuccess from "./RegistrationSuccess.jsx";

// Public Login + Register section displayed on the landing page.
// Register validates confirmPassword client-side, then calls the backend
// /api/auth/register (which generates a User ID and sends the welcome email).
export default function AuthSection() {
  const { login, register, authLoading } = useApp();
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please fill in both email and password.");
      return;
    }
    const res = await login(loginEmail, loginPassword);
    if (res.ok) {
      navigate("/dashboard");
    } else {
      setLoginError(res.error || "Login failed. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");

    if (!name.trim()) {
      setRegError("Please enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setRegError("Please enter a valid email address.");
      return;
    }
    if (password.length < 4) {
      setRegError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirm) {
      setRegError("Passwords do not match.");
      return;
    }

    const res = await register(name, email, password, confirm);
    if (res.ok) {
      setRegisteredUser(res.user);
    } else {
      setRegError(res.error || "Registration failed. Please try again.");
    }
  };

  // Success screen after registration
  if (registeredUser) {
    return <RegistrationSuccess user={registeredUser} />;
  }

  return (
    <section className="home-section">
      <div className="features-head">
        <h2 className="section-title">🔐 Login &amp; Register</h2>
        <p className="features-sub">
          Create a RailGaadi account to personalise your journey. Registration
          automatically sends a branded welcome email with your User ID.
        </p>
      </div>

      <div className="auth-section-grid">
        {/* ─── Login ─── */}
        <div className="glass-card auth-panel">
          <div className="auth-panel-head">
            <span className="auth-panel-icon">👋</span>
            <h3>Login</h3>
            <p>Welcome back! Sign in to continue.</p>
          </div>

          {loginError && <div className="auth-error">{loginError}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : "Login"}
            </button>
          </form>

          <p className="auth-panel-alt">
            New to RailGaadi?{" "}
            <a href="#auth-register" className="auth-link">
              Create an account
            </a>
          </p>
        </div>

        {/* ─── Register ─── */}
        <div className="glass-card auth-panel" id="auth-register">
          <div className="auth-panel-head">
            <span className="auth-panel-icon">🚂</span>
            <h3>Register</h3>
            <p>Create your RailGaadi account in seconds.</p>
          </div>

          {regError && <div className="auth-error">{regError}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
              {authLoading ? "Creating account..." : "Create RailGaadi Account"}
            </button>
          </form>

          <p className="auth-panel-alt">
            Already have an account?{" "}
            <a href="#auth-login" className="auth-link">
              Login
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
