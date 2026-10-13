import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import CountryPhoneInput from "./CountryPhoneInput.jsx";

export default function ForgetPasswordModal({ open, onClose }) {
  const { sendPhoneOtp, resendOtp, completePasswordReset, authLoading } = useApp();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("phone");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const closeModal = () => {
    setPhone("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("phone");
    setCooldown(0);
    setError("");
    setSuccess("");
    onClose();
  };

  useEffect(() => {
    if (!open || cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, cooldown]);

  if (!open) return null;

  const handleSend = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError("Please enter a valid mobile number.");
      return;
    }
    const result = await sendPhoneOtp(phone, "password-reset");
    if (result.ok) {
      setStep("otp");
      setCooldown(30);
      setSuccess(`Password reset SMS request accepted for ${phone}.`);
    } else {
      setError(result.error || "Could not send a verification code. Please try again.");
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit code from your SMS.");
      return;
    }
    if (newPassword.length < 4 || newPassword.length > 128) {
      setError("Password must be between 4 and 128 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const result = await completePasswordReset(phone, otp, newPassword);
    if (result.ok) {
      setSuccess(result.message || "Password reset successfully. Please log in.");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(closeModal, 1500);
    } else {
      setError(result.error || "Unable to verify the code and reset the password.");
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || authLoading) return;
    setError("");
    setSuccess("");
    const result = await resendOtp(phone);
    if (result.ok) {
      setOtp("");
      setCooldown(30);
      setSuccess(`A new password reset SMS request was accepted for ${phone}.`);
    } else {
      setError(result.error || "Could not resend the verification code.");
    }
  };

  return (
    <div className="modal-overlay modal-overlay-inner" onClick={closeModal}>
      <motion.div
        className="modal modal-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={closeModal} aria-label="Close">
          ✕
        </button>

        <div className="modal-brand">
          <span className="modal-brand-icon">🔑</span>
          <h2>Forgot Password</h2>
          <p>
            {step === "phone"
              ? "Verify your account phone before resetting your password."
              : `Enter the code sent to ${phone} and choose a new password.`}
          </p>
        </div>

        {success && <div className="auth-success" role="status">{success}</div>}
        {error && <div className="auth-error" role="alert">{error}</div>}

        {step === "phone" ? (
          <form onSubmit={handleSend} className="auth-form">
            <div className="form-field">
              <label>Account Mobile Number</label>
              <CountryPhoneInput value={phone} onChange={setPhone} disabled={authLoading} />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
              {authLoading ? "Sending code..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="form-field">
              <label>6-Digit Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                placeholder="Enter the code from your SMS"
                disabled={authLoading}
              />
            </div>
            <div className="form-field">
              <label>New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter a new password"
                disabled={authLoading}
              />
            </div>
            <div className="form-field">
              <label>Confirm New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter the new password"
                disabled={authLoading}
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
              {authLoading ? "Verifying..." : "Verify & Reset Password"}
            </button>
            <button type="button" className="auth-link" onClick={handleResend} disabled={authLoading || cooldown > 0}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
                setSuccess("");
              }}
              disabled={authLoading}
            >
              Change mobile number
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
