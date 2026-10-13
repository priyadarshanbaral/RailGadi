import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="footer-logo">🚂 Rail<em>Gaadi</em></span>
          <p>
            Your smart railway travel companion — track trains, explore routes and
            manage your journey from one platform.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/trains">Trains</Link>
          <Link to="/stations">Stations</Link>
          <Link to="/live">Live Tracking</Link>
          <Link to="/about">About RailGaadi</Link>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/auth?mode=login">Login</Link>
          <Link to="/auth?mode=register">Register</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <span>📧 support@railgaadi.in</span>
          <span>🚆 Railway Helpline: 139</span>
          <span>📍 India</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} RailGaadi. All rights reserved.</span>
        <span className="footer-ceo">
          Built with ❤️ by <strong>Priyadarshan Baral</strong> — CEO, RailGaadi
        </span>
      </div>
    </footer>
  );
}
