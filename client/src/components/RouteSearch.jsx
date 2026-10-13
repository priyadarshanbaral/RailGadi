import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client.js";

// Fallback common Indian railway stations for the dropdown
const FALLBACK_STATIONS = [
  { code: "NDLS", name: "New Delhi" },
  { code: "HWH", name: "Howrah" },
  { code: "BCT", name: "Mumbai Central" },
  { code: "CSMT", name: "Mumbai CSMT" },
  { code: "MAS", name: "Chennai Central" },
  { code: "SBC", name: "Bengaluru City" },
  { code: "BBS", name: "Bhubaneswar" },
  { code: "KGP", name: "Kharagpur" },
  { code: "GAYA", name: "Gaya" },
  { code: "BPL", name: "Bhopal" },
  { code: "JHS", name: "Jhansi" },
  { code: "GWL", name: "Gwalior" },
  { code: "ADI", name: "Ahmedabad" },
  { code: "ST", name: "Surat" },
  { code: "PNBE", name: "Patna" },
  { code: "DDU", name: "Pt. Deen Dayal Upadhyaya" },
  { code: "CNB", name: "Kanpur Central" },
  { code: "LKO", name: "Lucknow" },
  { code: "PUNE", name: "Pune" },
  { code: "SC", name: "Secunderabad" },
  { code: "JP", name: "Jaipur" },
  { code: "KOTA", name: "Kota" },
  { code: "CBE", name: "Coimbatore" },
  { code: "ERS", name: "Ernakulam" },
  { code: "NJP", name: "New Jalpaiguri" },
  { code: "CDG", name: "Chandigarh" },
  { code: "ASR", name: "Amritsar" },
  { code: "BHU", name: "Varanasi" },
  { code: "ALD", name: "Prayagraj" },
  { code: "MFP", name: "Muzaffarpur" },
  { code: "AJMER", name: "Ajmer" },
  { code: "GIMB", name: "Gandhidham" },
  { code: "KJM", name: "Krishnarajapuram" },
];

export default function RouteSearch() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [stations, setStations] = useState(FALLBACK_STATIONS);

  // Load all stations from central railway database
  useEffect(() => {
    api
      .getStations()
      .then((data) => {
        if (data && Array.isArray(data.stations) && data.stations.length) {
          setStations(data.stations);
        }
      })
      .catch(() => {
        // keep fallback list
      });
  }, []);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const getFilteredStations = useMemo(() => {
    return (value, otherValue) => {
      if (!value) return stations;
      return stations.filter(
        (s) =>
          (s.code.includes(value) || s.name.toLowerCase().includes(value.toLowerCase())) &&
          s.code !== otherValue
      );
    };
  }, [stations]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSearched(true);

    if (!from || !to) {
      setError("Please select both From and To stations.");
      return;
    }
    if (from === to) {
      setError("From and To stations cannot be the same.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.searchByRoute(from, to);
      setResult(res);
    } catch (err) {
      setError(
        err.message.includes("404") || err.message.includes("500")
          ? "No trains found for this route, or invalid station selection."
          : "Unable to search trains right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStationDropdown = (value, setValue, open, setOpen, other) => {
    const filteredStations = getFilteredStations(value, other);
    
    return (
      <div className="route-station">
        <div className="route-input-wrap">
          <input
            className="route-input"
            value={value}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setValue(val);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Select station code"
          />
          <span className="route-input-caret">▾</span>
        </div>
        {open && filteredStations.length > 0 && (
          <div className="route-dropdown">
            {filteredStations.slice(0, 40).map((s) => (
              <button
                key={s.code}
                type="button"
                className="route-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(s.code);
                  setOpen(false);
                }}
              >
                <span className="route-dropdown-code">{s.code}</span>
                <span className="route-dropdown-name">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="route-search glass-card">
      <div className="route-search-head">
        <span className="route-search-icon">🔎</span>
        <h3>Search Train Between Stations</h3>
      </div>

      <form onSubmit={handleSearch} className="route-form">
        <div className="route-fields">
          {renderStationDropdown(from, setFrom, fromOpen, setFromOpen, to)}
          <button type="button" className="route-swap" onClick={swap} title="Swap stations">
            ⇄
          </button>
          {renderStationDropdown(to, setTo, toOpen, setToOpen, from)}
        </div>

        <button type="submit" className="btn btn-primary route-submit" disabled={loading}>
          {loading ? "Searching..." : "Find Trains"}
        </button>
      </form>

      {error && <div className="route-error">{error}</div>}

      {result && (
        <div className="route-results fade-in-up">
          <div className="route-result-head">
            <strong>
              {result.from?.name} → {result.to?.name}
            </strong>
            <span className="route-count">{result.count} train(s) found</span>
          </div>

          {result.trains.length === 0 ? (
            <div className="route-empty">No direct trains found for this route.</div>
          ) : (
            <div className="route-train-list">
              {result.trains.map((t) => (
                <motion.div
                  className="route-train"
                  key={t.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="route-train-top">
                    <span className="route-train-number">{t.number}</span>
                    <span className="route-train-name">{t.name}</span>
                  </div>
                  <div className="route-train-meta">
                    <span className="badge train-type">{t.type}</span>
                    <span className={`badge ${t.status === "On Time" ? "badge-on-time" : "badge-delayed"}`}>
                      {t.status}
                      {t.delay > 0 ? ` +${t.delay}` : ""}
                    </span>
                    <span className="route-train-stops">{t.stops} stop(s)</span>
                  </div>
                  <Link to={`/train/${t.number}`} className="btn btn-primary route-train-view">
                    View Live Status
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {searched && !result && !loading && !error && (
        <div className="route-empty">Searching...</div>
      )}
    </div>
  );
}
