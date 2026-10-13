import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Shown after a successful registration: celebrates the account, displays the
// generated User ID, confirms the welcome email, and offers a CTA to continue.
export default function RegistrationSuccess({ user }) {
  const email = user?.email || "";
  const userId = user?.userId || "";
  const emailStatus = user?.emailStatus || null;
  const emailSent = emailStatus?.success === true;

  return (
    <motion.div
      className="reg-success glass-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="reg-success-icon">🎉</div>
      <h2 className="reg-success-title">Registration Successful!</h2>
      <p className="reg-success-sub">
        Your RailGaadi account has been created successfully.
      </p>

      <div className="reg-success-id">
        <span>User ID</span>
        <strong>{userId}</strong>
      </div>

      <div className="reg-success-email">
        <span>📧 {emailSent ? "A confirmation email has been sent to" : "Registered email"}</span>
        <strong>{email}</strong>
      </div>

      {emailSent ? (
        <p className="reg-success-note">
          Check your Gmail inbox for your branded welcome email with your full
          account details.
        </p>
      ) : (
        <p className="reg-success-note reg-success-warn">
          ⚠️ We could not send the confirmation email right now, but your
          account was created successfully. The server may be missing valid
          Gmail credentials (<code>EMAIL_USER</code> / <code>EMAIL_PASS</code>)
          in <code>server/.env</code>. Please contact support.
        </p>
      )}

      <div className="reg-success-actions">
        <Link to="/dashboard" className="btn btn-primary">
          Continue to RailGaadi →
        </Link>
        <Link to="/" className="btn">
          🏠 Back to Home
        </Link>
      </div>
    </motion.div>
  );
}
