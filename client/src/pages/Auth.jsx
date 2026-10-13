import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import RegistrationSuccess from "../components/RegistrationSuccess.jsx";
import CountryPhoneInput from "../components/CountryPhoneInput.jsx";
import PhoneOtpLogin from "../components/PhoneOtpLogin.jsx";

export default function Auth() {
  const { login, sendOtp, verifyOtp, resendOtp, authLoading, user } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState(initialMode);
  // Registration steps: "form" | "otp"
  const [regStep, setRegStep] = useState("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);

  // Status and feedback
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [registeredUser, setRegisteredUser] = useState(null);

  // Timers
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(30);

  // OTP Expiry countdown
  useEffect(() => {
    if (regStep !== "otp") return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [regStep]);

  // Resend cooldown timer
  useEffect(() => {
    if (regStep !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [regStep, resendCooldown]);

  useEffect(() => {
    setMode(initialMode);
    setRegStep("form");
    setError("");
  }, [initialMode]);

  // Already logged in → go to dashboard, but let new registrants see success.
  if (user && !registeredUser) {
    navigate("/dashboard");
    return null;
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Send OTP for registration
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (!name.trim()) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Please enter a valid email address.");
    if (!/^\+[1-9]\d{7,14}$/.test(phone))
      return setError("Please enter a valid mobile number.");
    if (password.length < 4)
      return setError("Password must be at least 4 characters long.");
    if (password !== confirm) return setError("Passwords do not match.");

    const res = await sendOtp(
      name,
      email,
      phone,
      password,
      confirm
    );
    if (res.ok) {
      setRegStep("otp");
      setExpirySeconds(300);
      setResendCooldown(30);
      setInfoMsg(`A 6-digit verification code has been sent by SMS to ${res.data.phone}`);
    } else {
      setError(res.error || "Failed to send verification code. Please try again.");
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      return setError("Please enter the 6-digit OTP code sent to your mobile.");
    }
    if (otp.trim().length !== 6) {
      return setError("OTP must be exactly 6 digits.");
    }

    const res = await verifyOtp(
      { name, email, phone, password, confirmPassword: confirm },
      otp.trim()
    );
    if (res.ok) {
      if (res.message?.includes("login successful")) {
        navigate("/dashboard");
        return;
      }
      setRegisteredUser({ ...res.user, phoneVerified: res.phoneVerified });
    } else {
      setError(res.error || "OTP verification failed. Please check the code and try again.");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setInfoMsg("");

    const res = await resendOtp(phone);
    if (res.ok) {
      setResendCooldown(30);
      setExpirySeconds(300);
      setOtp("");
      setInfoMsg(`A new verification code has been sent by SMS to ${phone}`);
    } else {
      setError(res.error || "Failed to resend OTP. Please try again.");
    }
  };

  // Handle standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim())
      return setError("Please enter both email and password.");

    const res = await login(email, password);
    if (res.ok) {
      navigate("/dashboard");
    } else {
      setError(res.error || "Login failed. Please check your credentials.");
    }
  };

  // Success view
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
          <img
            src="https://cdn-icons-png.flaticon.com/128/1034/1034693.png"
            alt="RailGaadi"
            className="login-brand-icon"
          />
          <h1>
            {mode === "login"
              ? "Welcome Back"
              : regStep === "otp"
              ? "Verify Mobile"
              : "Create Account"}
          </h1>
          <p>
            {mode === "login"
              ? "Login to access your RailGaadi dashboard"
              : regStep === "otp"
              ? "Enter the 6-digit OTP code sent to your mobile"
              : "Enter your name, email and mobile number to receive an SMS verification code"}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {infoMsg && <div className="auth-success">{infoMsg}</div>}

        {/* =====================================================
            1) REGISTRATION - STEP 2: OTP VERIFICATION FORM
        ===================================================== */}
        {mode === "register" && regStep === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-email-banner">
              <span>Code sent to:</span>
              <strong>{phone}</strong>
            </div>

            <div className="form-field">
              <label>6-Digit Verification Code</label>
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

            <div className="otp-timer-row">
              <span className="otp-expiry">
                {expirySeconds > 0
                  ? `⏰ Expires in ${formatTimer(expirySeconds)}`
                  : "⚠️ Code expired"}
              </span>
              <button
                type="button"
                className="otp-resend-link"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || authLoading}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={authLoading || otp.length !== 6}
            >
              {authLoading ? "Verifying..." : "Verify & Activate Account 🚀"}
            </button>

            <button
              type="button"
              className="btn btn-secondary back-step-btn"
              onClick={() => {
                setRegStep("form");
                setError("");
                setInfoMsg("");
              }}
            >
              ← Edit Registration Details
            </button>
          </form>
        ) : mode === "register" ? (
          /* =====================================================
              2) REGISTRATION - STEP 1: INITIAL DETAILS FORM
          ===================================================== */
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-field">
              <label>Email Address (used to log in)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
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
                placeholder="Create a password (min 4 characters)"
              />
            </div>

            <div className="form-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={authLoading}
            >
              {authLoading ? "Sending Verification Code..." : "Send Verification OTP ➔"}
            </button>
          </form>
        ) : (
          phoneLoginOpen ? (
            <PhoneOtpLogin
              onSuccess={() => navigate("/dashboard")}
              onCancel={() => setPhoneLoginOpen(false)}
            />
          ) : (
            <>
              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-field">
                  <label>Gmail / Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
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
                  {authLoading ? "Logging in..." : "Login to RailGaadi"}
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
          )
        )}

        <div className="auth-switch">
          {mode === "login" ? (
            <span>
              Don't have an account?{" "}
              <button
                className="auth-link"
                onClick={() => {
                  setMode("register");
                  setRegStep("form");
                  setPhoneLoginOpen(false);
                  setError("");
                  setInfoMsg("");
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
                  setRegStep("form");
                  setPhoneLoginOpen(false);
                  setError("");
                  setInfoMsg("");
                }}
              >
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
