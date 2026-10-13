import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../api/client.js";
import TrainCard from "../components/TrainCard.jsx";

// Protected user dashboard — shows the user's profile (with User ID), favourite
// trains and recent searches. Redirects to /auth if not logged in.
export default function Dashboard() {
  const { user, token, logout, favorites, recentSearches } = useApp();
  const navigate = useNavigate();
  const [serverFavs, setServerFavs] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    if (token) {
      api.user
        .getFavorites(token)
        .then(setServerFavs)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  if (!user) return null;

  return (
    <div className="data-page fade-in-up">
      <motion.div
        className="glass-card data-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="data-title">👤 Dashboard</h1>
        <p className="data-sub">Welcome back, {user.name}! Here's your RailGaadi overview.</p>
      </motion.div>

      {/* Profile card */}
      <div className="dash-profile">
        <div className="dash-avatar">🚂</div>
        <div className="dash-info">
          <h3>{user.name}</h3>
          <p>📧 {user.email}</p>
          {user.userId && <p className="dash-user-id">🆔 User ID: {user.userId}</p>}
        </div>
        <button className="btn dash-logout" onClick={() => { logout(); navigate("/"); }}>
          Logout
        </button>
      </div>

      {/* Quick actions */}
      <div className="dash-actions">
        <Link to="/live" className="btn btn-primary">📍 Live Tracking</Link>
        <Link to="/trains" className="btn">🚆 Trains</Link>
        <Link to="/stations" className="btn">🚉 Stations</Link>
        <Link to="/" className="btn">🏠 Home</Link>
      </div>

      {/* Favourites */}
      <section className="home-section">
        <h2 className="section-title">⭐ Favourite Trains</h2>
        {favorites.length === 0 && serverFavs.length === 0 ? (
          <div className="route-empty glass-card">
            No favourite trains yet. Browse trains and tap ☆ to save them.
          </div>
        ) : (
          <div className="grid grid-3">
            {(favorites.length ? favorites : serverFavs).map((t) => (
              <TrainCard key={t.number} train={t} />
            ))}
          </div>
        )}
      </section>

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">🕘 Recent Searches</h2>
          <div className="recent-list">
            {recentSearches.map((t) => (
              <Link to={`/train/${t.number}`} className="recent-item" key={t.number}>
                <span className="recent-number">{t.number}</span>
                <span className="recent-name">{t.name}</span>
                <span className="recent-route">{t.from} → {t.to}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
