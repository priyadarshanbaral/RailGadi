import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import RegistrationSuccess from "./RegistrationSuccess.jsx";
import CountryPhoneInput from "./CountryPhoneInput.jsx";
import PhoneOtpLogin from "./PhoneOtpLogin.jsx";

// Public Login + Register section displayed on the landing page.
// Accounts are created only after the user verifies the SMS OTP.
export default function AuthSection() {
  const { login, sendOtp, verifyOtp, resendOtp, authLoading } = useApp();
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);

  // Register state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regStep, setRegStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registeredUser, setRegisteredUser] = useState(null);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

  const handleRequestOtp = async (e) => {
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
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setRegError("Please enter a valid mobile number.");
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

    const res = await sendOtp(
      name,
      email,
      phone,
      password,
      confirm
    );
    if (res.ok) {
      setRegStep("otp");
      setResendCooldown(30);
    } else {
      setRegError(res.error || "Could not send a verification code. Please try again.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setRegError("");
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
      setRegError(res.error || "The verification code could not be verified.");
    }
  };

  const handleResendOtp = async () => {
    setRegError("");
    const res = await resendOtp(phone);
    if (res.ok) {
      setOtp("");
      setResendCooldown(30);
    } else {
      setRegError(res.error || "Could not resend the verification code.");
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
          Create a RailGaadi account to personalise your journey. Verify your
          mobile number with an SMS code before your account is created.
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

          {phoneLoginOpen ? (
            <PhoneOtpLogin onSuccess={() => navigate("/dashboard")} onCancel={() => setPhoneLoginOpen(false)} />
          ) : (
          <>
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
          <button type="button" className="auth-link" onClick={() => setPhoneLoginOpen(true)}>
            Login with mobile number
          </button>
          </>
          )}

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
            <p>{regStep === "otp" ? `Enter the code sent by SMS to ${phone}.` : "Verify your mobile number by SMS to create your account."}</p>
          </div>

          {regError && <div className="auth-error">{regError}</div>}

          {regStep === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="form-field">
                <label>6-Digit Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter the code from your SMS"
                />
              </div>
              <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading || otp.length !== 6}>
                {authLoading ? "Verifying..." : "Verify & Create Account"}
              </button>
              <button type="button" className="auth-link" onClick={handleResendOtp} disabled={authLoading || resendCooldown > 0}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </button>
              <button type="button" className="auth-link" onClick={() => { setRegStep("form"); setOtp(""); setRegError(""); }}>
                Edit registration details
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestOtp} className="auth-form">
              <div className="form-field">
                <label>Full Name</label>
                <input type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Email (used to log in)</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Mobile Number (for SMS verification)</label>
                <CountryPhoneInput value={phone} onChange={setPhone} disabled={authLoading} />
              </div>
              <div className="form-field">
                <label>Password</label>
                <input type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Confirm Password</label>
                <input type="password" placeholder="Re-enter your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
                {authLoading ? "Sending verification code..." : "Send Verification Code"}
              </button>
            </form>
          )}

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
