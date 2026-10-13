import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client.js";
import { SkeletonGrid } from "./Skeleton.jsx";

// Public railway station browser — searchable list of stations with details.
// No login required.
export default function StationSection() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .getStations()
      .then((data) => setStations(data.stations || []))
      .catch(() => setStations([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations.slice(0, 12);
    return stations.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [stations, query]);

  return (
    <section className="home-section">
      <div className="features-head">
        <h2 className="section-title">🚉 Explore Stations</h2>
        <p className="features-sub">
          Search railway stations by code, name or state — fully public and free to explore.
        </p>
      </div>

      <div className="train-toolbar glass-card">
        <input
          className="train-toolbar-search"
          placeholder="Search station by code, name or state (e.g. NDLS or New Delhi)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="train-toolbar-count">{filtered.length} stations</span>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="route-empty glass-card">No stations match your search.</div>
      ) : (
        <div className="station-grid">
          {filtered.map((s, i) => (
            <motion.div
              className="glass-card station-card-mini"
              key={s.code}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06, duration: 0.35 }}
            >
              <div className="station-card-top">
                <span className="station-card-code">{s.code}</span>
                <span className="station-card-platform">🛤️ P{s.platform}</span>
              </div>
              <h3 className="station-card-name">{s.name}</h3>
              <p className="station-card-state">{s.state}</p>
              <div className="station-card-gps">
                📡 {s.lat}, {s.lng}
              </div>
              <Link to={`/stations?station=${s.code}`} className="btn btn-primary station-card-view">
                View Trains
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="train-see-all">
        <Link to="/stations" className="btn">
          View All Stations →
        </Link>
      </div>
    </section>
  );
}
