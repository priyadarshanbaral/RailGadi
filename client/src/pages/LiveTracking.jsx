import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../components/SearchBar.jsx";

// Live tracking landing page — highlights the live features and lets users
// pick a train via the search bar to open its live status.
export default function LiveTracking() {
  return (
    <div className="data-page fade-in-up">
      <motion.div
        className="glass-card data-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="data-title">📍 Live Train Tracking</h1>
        <p className="data-sub">
          Track any train in real time — current location, running status, next
          station, ETA and journey progress. Search by train number or name.
        </p>
      </motion.div>

      <div className="live-hero">
        <SearchBar />
      </div>

      <div className="home-section">
        <div className="features-head">
          <h2 className="section-title">What you'll see live</h2>
        </div>
        <div className="live-features-grid">
          {[
            { icon: "📍", label: "Current Location", desc: "Exact GPS position of the train" },
            { icon: "🚉", label: "Current Station", desc: "Where the train is right now" },
            { icon: "⏭️", label: "Next Station", desc: "Upcoming stop & estimated arrival" },
            { icon: "⏱️", label: "Running Status", desc: "On time or delayed indicator" },
            { icon: "📏", label: "Distance", desc: "Distance covered & remaining" },
            { icon: "📊", label: "Journey Progress", desc: "Live completion percentage" },
          ].map((f, i) => (
            <motion.div
              className="glass-card feature-card"
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08 }}
            >
              <span className="feature-icon">{f.icon}</span>
              <strong className="feature-title">{f.label}</strong>
              <p className="feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="train-see-all">
        <Link to="/trains" className="btn">
          Browse All Trains →
        </Link>
        <Link to="/" className="btn">
          🏠 Back to Home
        </Link>
      </div>
    </div>
  );
}
