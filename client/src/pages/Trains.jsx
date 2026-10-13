import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client.js";
import TrainCard from "../components/TrainCard.jsx";
import { SkeletonGrid } from "../components/Skeleton.jsx";

// Full train browser page — search by number/name, filter by type, view details.
export default function Trains() {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [shown, setShown] = useState(12);

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

  useEffect(() => setShown(12), [query, typeFilter]);

  return (
    <div className="data-page fade-in-up">
      <motion.div
        className="glass-card data-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="data-title">🚆 All Trains</h1>
        <p className="data-sub">
          Browse Indian Railways trains — search by number/name, filter by type
          and open live details. No login required.
        </p>
      </motion.div>

      <div className="glass-card data-toolbar">
        <input
          className="data-search"
          placeholder="Search by train number, name or type..."
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
        <span className="data-count">{filtered.length} trains</span>
      </div>

      {loading ? (
        <SkeletonGrid count={12} />
      ) : filtered.length === 0 ? (
        <div className="route-empty glass-card">No trains match your search.</div>
      ) : (
        <>
          <div className="grid grid-3">
            {filtered.slice(0, shown).map((t) => (
              <TrainCard key={t.number} train={t} />
            ))}
          </div>
          {shown < filtered.length && (
            <div className="train-see-all">
              <button className="btn btn-primary" onClick={() => setShown((s) => s + 12)}>
                Load More ({filtered.length - shown} remaining)
              </button>
            </div>
          )}
        </>
      )}

      <div className="train-see-all">
        <Link to="/" className="btn">
          🏠 Back to Home
        </Link>
      </div>
    </div>
  );
}
