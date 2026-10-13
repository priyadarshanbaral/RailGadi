import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";

export default function ForgetPasswordModal({ open, onClose }) {
  const { forgotPassword, authLoading } = useApp();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !newPassword.trim()) {
      setError("Please fill in email and new password.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const res = await forgotPassword(email, newPassword);
    if (res.ok) {
      setSuccess("Password reset successful! Please login with your new password.");
      setEmail("");
      setNewPassword("");
      setConfirm("");
      setTimeout(() => onClose(), 1500);
    } else {
      setError(res.error || "Unable to reset password. Please try again.");
    }
  };

  return (
    <div className="modal-overlay modal-overlay-inner" onClick={onClose}>
      <motion.div
        className="modal modal-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-brand">
          <span className="modal-brand-icon">🔑</span>
          <h2>Forgot Password</h2>
          <p>Enter your email and a new password</p>
        </div>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

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
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="form-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={authLoading}>
            {authLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
