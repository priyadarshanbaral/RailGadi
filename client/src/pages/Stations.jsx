import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client.js";
import { SkeletonGrid } from "../components/Skeleton.jsx";

// Full station browser page — searchable list of stations with a detail panel
// showing the trains that stop at a selected station.
export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(200);
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(params.get("station") || null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api
      .getStations()
      .then((data) => setStations(data.stations || []))
      .catch(() => setStations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const code = params.get("station");
    if (code) {
      setSelected(code);
      loadDetail(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const loadDetail = async (code) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.getTrainsByStation(code);
      setDetail(res);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? stations.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q)
    ) : stations).slice(0, shown);
  }, [stations, query, shown]);

  useEffect(() => setShown(200), [query]);

  return (
    <div className="data-page fade-in-up">
      <motion.div
        className="glass-card data-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="data-title">🚉 All Stations</h1>
        <p className="data-sub">
          Browse Indian Railway stations — search by code, name or state, and see
          which trains pass through. No login required.
        </p>
      </motion.div>

      <div className="glass-card data-toolbar">
        <input
          className="data-search"
          placeholder="Search by code, name or state..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="data-count">{filtered.length} stations</span>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="route-empty glass-card">No stations match your search.</div>
      ) : (
        <div className="glass-card data-table-card">
          <div className="data-table">
            <div className="data-table-row data-table-head">
              <span>Code</span>
              <span>Station</span>
              <span>State</span>
              <span>Platform</span>
              <span>Lat / Lng</span>
            </div>
            {filtered.map((s) => (
              <button
                key={s.code}
                className="data-table-row data-table-body"
                onClick={() => {
                  setSelected(s.code);
                  loadDetail(s.code);
                }}
              >
                <span className="data-code">{s.code}</span>
                <span className="data-name">{s.name}</span>
                <span className="data-muted">{s.state}</span>
                <span className="data-platform">🛤️ {s.platform}</span>
                <span className="data-gps">{s.lat}, {s.lng}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {shown < stations.filter((s) => {
        const q = query.trim().toLowerCase();
        return (
          !q ||
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q)
        );
      }).length && (
        <div className="train-see-all">
          <button className="btn btn-primary" onClick={() => setShown((count) => count + 200)}>
            Load More ({stations.filter((s) => {
              const q = query.trim().toLowerCase();
              return (
                !q ||
                s.code.toLowerCase().includes(q) ||
                s.name.toLowerCase().includes(q) ||
                s.state.toLowerCase().includes(q)
              );
            }).length - shown} remaining)
          </button>
        </div>
      )}

      {selected && (
        <div className="glass-card station-detail-panel">
          <div className="station-detail-head">
            <h3>
              🚉 {selected} — Trains through this station
            </h3>
            <button className="btn" onClick={() => setSelected(null)}>
              ✕ Close
            </button>
          </div>

          {detailLoading ? (
            <div className="skeleton" style={{ height: 100 }} />
          ) : detail ? (
            <div className="station-train-list">
              {detail.trains.length === 0 ? (
                <div className="route-empty">No trains found for this station.</div>
              ) : (
                detail.trains.map((t) => (
                  <div className="route-train" key={t.number}>
                    <div className="route-train-top">
                      <span className="route-train-number">{t.number}</span>
                      <span className="route-train-name">{t.name}</span>
                    </div>
                    <div className="route-train-meta">
                      <span className="badge train-type">{t.type}</span>
                      <span className={`badge ${t.status === "On Time" ? "badge-on-time" : "badge-delayed"}`}>
                        {t.status}
                      </span>
                      <span className="route-train-stops">{t.from} → {t.to}</span>
                    </div>
                    <Link to={`/train/${t.number}`} className="btn btn-primary route-train-view">
                      View Live Status
                    </Link>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="route-empty">Could not load station details.</div>
          )}
        </div>
      )}

      <div className="train-see-all">
        <Link to="/" className="btn">
          🏠 Back to Home
        </Link>
      </div>
    </div>
  );
}
