import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client.js";
import { SkeletonGrid } from "./Skeleton.jsx";

// Public train browser — dynamically loaded from /api/trains/all with live
// search (by number/name/type) and filtering. No login required.
export default function TrainDetailsSection() {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    api
      .getAllTrains()
      .then((data) => {
        const seen = new Set();
        const unique = (data || []).filter((t) => {
          if (seen.has(t.number)) return false;
          seen.add(t.number);
          return true;
        });
        setTrains(unique);
      })
      .catch(() => setTrains([]))
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(() => {
    const set = new Set(trains.map((t) => t.type).filter(Boolean));
    return ["All", ...set];
  }, [trains]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trains.filter((t) => {
      const inType = typeFilter === "All" || t.type === typeFilter;
      const inQuery =
        !q ||
        t.number.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        (t.type || "").toLowerCase().includes(q) ||
        (t.fromCode || "").toLowerCase().includes(q) ||
        (t.toCode || "").toLowerCase().includes(q);
      return inType && inQuery;
    });
  }, [trains, query, typeFilter]);

  return (
    <section className="home-section">
      <div className="features-head">
        <h2 className="section-title">🚆 Explore Trains</h2>
        <p className="features-sub">
          Search by train number or name, filter by type, and view live details — no account needed.
        </p>
      </div>

      <div className="train-toolbar glass-card">
        <input
          className="train-toolbar-search"
          placeholder="Search by train number or name (e.g. 12301 or Rajdhani)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="train-toolbar-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="train-toolbar-count">{filtered.length} trains</span>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="route-empty glass-card">No trains match your search.</div>
      ) : (
        <div className="train-details-grid">
          {filtered.slice(0, 12).map((t, i) => (
            <motion.div
              className="glass-card train-detail-card"
              key={t.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06, duration: 0.35 }}
            >
              <div className="train-detail-top">
                <span className="train-detail-number">{t.number}</span>
                <span className="badge train-type">{t.type}</span>
              </div>
              <h3 className="train-detail-name">{t.name}</h3>

              <div className="train-detail-route">
                <div className="td-station">
                  <strong>{t.fromCode || "—"}</strong>
                  <small>{t.from}</small>
                </div>
                <div className="td-line">
                  <span className="td-arrow">→</span>
                  <span className={`badge ${t.status === "On Time" ? "badge-on-time" : "badge-delayed"}`}>
                    {t.status}
                  </span>
                </div>
                <div className="td-station">
                  <strong>{t.toCode || "—"}</strong>
                  <small>{t.to}</small>
                </div>
              </div>

              <div className="train-detail-meta">
                <span>🛤️ {t.journeyStations || "—"} stops</span>
                <span>
                  {t.delay > 0 ? `⏱️ +${t.delay} min` : "⏱️ On schedule"}
                </span>
              </div>

              <Link to={`/train/${t.number}`} className="btn btn-primary train-detail-view">
                View Train Details
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="train-see-all">
        <Link to="/trains" className="btn">
          View All Trains →
        </Link>
      </div>
    </section>
  );
}
