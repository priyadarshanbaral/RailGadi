import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client.js";

export default function StationSearch() {
  const [stations, setStations] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingStation, setLoadingStation] = useState(false);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const wrapRef = useRef(null);

  // Load full station list once for autocomplete
  useEffect(() => {
    api
      .getStations()
      .then((data) => setStations(data.stations || []))
      .catch(() => setStations([]));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stations
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [stations, query]);

  const selectStation = async (s) => {
    setOpen(false);
    setQuery(`${s.code} — ${s.name}`);
    setSelected(s);
    setResult(null);
    setError("");
    setLoadingStation(true);
    try {
      const res = await api.getTrainsByStation(s.code);
      setResult(res);
    } catch (err) {
      setError(err.message || "Could not load trains for this station.");
    } finally {
      setLoadingStation(false);
    }
  };

  return (
    <div className="station-search glass-card" ref={wrapRef}>
      <div className="station-search-head">
        <span className="station-search-icon">🚉</span>
        <h3>Search Trains by Station</h3>
      </div>

      <div className="station-search-input-wrap">
        <input
          className="station-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Enter station code or name (e.g. NDLS or New Delhi)"
        />
        <span className="station-search-caret">▾</span>
      </div>

      {open && query.trim() && (
        <div className="station-search-dropdown">
          {matches.length === 0 ? (
            <div className="station-search-hint">No stations found</div>
          ) : (
            matches.map((s) => (
              <button
                key={s.code}
                type="button"
                className="station-search-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectStation(s);
                }}
              >
                <span className="station-search-code">{s.code}</span>
                <span className="station-search-name">
                  {s.name}
                  <small>{s.state}</small>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {error && <div className="route-error">{error}</div>}

      {loadingStation && <div className="station-search-loading">Loading trains...</div>}

      {selected && result && !loadingStation && (
        <div className="station-search-results fade-in-up">
          {/* Highlighted searched station */}
          <div className="station-highlight">
            <div className="station-highlight-code">{result.station.code}</div>
            <div className="station-highlight-info">
              <h4>{result.station.name}</h4>
              <p>
                {result.station.state} · 🛤️ Platform {result.station.platform} · Elevation{" "}
                {result.station.elev} m
              </p>
              <small className="station-highlight-count">
                {result.count} train(s) pass through this station
              </small>
            </div>
          </div>

          {result.trains.length === 0 ? (
            <div className="route-empty">No trains found for this station.</div>
          ) : (
            <div className="station-train-list">
              {result.trains.map((t) => (
                <motion.div
                  className="station-train"
                  key={t.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="station-train-top">
                    <span className="station-train-number">{t.number}</span>
                    <span className="station-train-name">{t.name}</span>
                  </div>
                  <div className="station-train-route">
                    <span>
                      <strong>{t.fromCode}</strong>
                      <small>{t.from}</small>
                    </span>
                    <span className="route-arrow">→</span>
                    <span>
                      <strong>{t.toCode}</strong>
                      <small>{t.to}</small>
                    </span>
                  </div>
                  <div className="station-train-meta">
                    <span className="badge train-type">{t.type}</span>
                    <span
                      className={`badge ${
                        t.status === "On Time" ? "badge-on-time" : "badge-delayed"
                      }`}
                    >
                      {t.status}
                      {t.delay > 0 ? ` +${t.delay}` : ""}
                    </span>
                    <span className="station-train-role">{t.role}</span>
                  </div>
                  <Link to={`/train/${t.number}`} className="btn btn-primary station-train-view">
                    View Live Status
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

