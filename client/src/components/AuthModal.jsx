import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import ForgetPasswordModal from "./ForgetPasswordModal.jsx";
import CountryPhoneInput from "./CountryPhoneInput.jsx";
import PhoneOtpLogin from "./PhoneOtpLogin.jsx";

export default function AuthModal({ open, onClose }) {
  const { login, sendOtp, verifyOtp, resendOtp, authLoading } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [regStep, setRegStep] = useState("form"); // "form" | "otp"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);

  useEffect(() => {
    if (!open || resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, resendCooldown]);

  if (!open) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim() || !password.trim()) {
      return setError("Please fill in all fields.");
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return setError("Please enter a valid email address.");
    }
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return setError("Please enter a valid mobile number.");
    }

    const res = await sendOtp(
      name,
      email,
      phone,
      password,
      undefined
    );
    if (res.ok) {
      setRegStep("otp");
      setResendCooldown(30);
      setSuccess(`Verification code sent by SMS to ${phone}`);
    } else {
      setError(res.error || "Failed to send verification code.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim() || otp.trim().length !== 6) {
      return setError("Please enter the 6-digit OTP code.");
    }

    const res = await verifyOtp({ name, email, phone, password }, otp.trim());
    if (res.ok) {
      if (res.message?.includes("login successful")) {
        onClose();
        navigate("/dashboard");
        return;
      }
      setSuccess("Account verified and registered successfully!");
      setTimeout(() => {
        onClose();
        setMode("login");
        setRegStep("form");
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setOtp("");
        setResendCooldown(0);
        navigate("/dashboard");
      }, 1500);
    } else {
      setError(res.error || "Invalid OTP code.");
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    const res = await resendOtp(phone);
    if (res.ok) {
      setOtp("");
      setResendCooldown(30);
      setSuccess(`A new verification code has been sent by SMS to ${phone}`);
    } else {
      setError(res.error || "Could not resend the verification code.");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      return setError("Please fill in both email and password.");
    }

    const res = await login(email, password);
    if (res.ok) {
      setSuccess("Login successful!");
      setTimeout(() => {
        onClose();
        navigate("/dashboard");
      }, 1000);
    } else {
      setError(res.error || "Login failed.");
    }
  };

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
          <h2>
            {mode === "login"
              ? "Welcome Back"
              : regStep === "otp"
              ? "Verify OTP"
              : "Create Account"}
          </h2>
          <p>
            {regStep === "otp"
              ? `Enter the 6-digit code sent to ${phone}`
              : "RailGaadi — live train tracking"}
          </p>
        </div>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        {mode === "register" && regStep === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-field">
              <label>6-Digit Code</label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                className="otp-input-box"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={authLoading || otp.length !== 6}
            >
              {authLoading ? "Verifying..." : "Verify & Activate Account"}
            </button>

            <button
              type="button"
              className="auth-link"
              onClick={handleResendOtp}
              disabled={authLoading || resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
            </button>

            <button
              type="button"
              className="btn btn-secondary back-step-btn"
              onClick={() => {
                setRegStep("form");
                setError("");
                setSuccess("");
              }}
            >
              ← Back to Details
            </button>
          </form>
        ) : mode === "register" ? (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-field">
              <label>Email (used to log in)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-field">
              <label>Mobile Number (for SMS verification)</label>
              <CountryPhoneInput value={phone} onChange={setPhone} disabled={authLoading} />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={authLoading}
            >
              {authLoading ? "Sending OTP..." : "Send Verification OTP ➔"}
            </button>
          </form>
        ) : phoneLoginOpen ? (
          <PhoneOtpLogin
            onSuccess={() => {
              onClose();
              navigate("/dashboard");
            }}
            onCancel={() => setPhoneLoginOpen(false)}
          />
        ) : (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-field">
              <label>Gmail / Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
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

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={authLoading}
            >
              {authLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          {mode === "login" ? (
            <span>
              Don't have an account?{" "}
              <button
                className="auth-link"
                onClick={() => {
                  setMode("register");
                  setPhoneLoginOpen(false);
                  setRegStep("form");
                  setError("");
                  setSuccess("");
                }}
              >
                Register with OTP
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                className="auth-link"
                onClick={() => {
                  setMode("login");
                  setPhoneLoginOpen(false);
                  setRegStep("form");
                  setError("");
                  setSuccess("");
                }}
              >
                Login
              </button>
            </span>
          )}
        </div>

        {mode === "login" && !phoneLoginOpen && (
          <button
            type="button"
            className="auth-link"
            onClick={() => setPhoneLoginOpen(true)}
          >
            Login with mobile number
          </button>
        )}

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
