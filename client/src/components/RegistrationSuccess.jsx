import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Shown after a successful registration: celebrates the account, displays the
// generated User ID, confirms phone verification, and offers a CTA to continue.
export default function RegistrationSuccess({ user }) {
  const email = user?.email || "";
  const phone = user?.phone || "";
  const userId = user?.userId || "";

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
        <span>📱 Mobile verified</span>
        <strong>{phone}</strong>
      </div>

      <p className="reg-success-note">
        Your email <strong>{email}</strong> is saved as your account login.
      </p>

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
