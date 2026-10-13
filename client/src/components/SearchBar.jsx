import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useApp } from "../context/AppContext.jsx";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { addRecentSearch } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchTrains(query);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectTrain = (train) => {
    addRecentSearch(train);
    setShowDropdown(false);
    setQuery("");
    navigate(`/train/${train.number}`);
  };

  return (
    <div className="searchbar">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Enter train number or name (e.g. 12301 or Rajdhani)"
        className="searchbar-input"
      />
      {showDropdown && query.trim() && (
        <div className="searchbar-dropdown">
          {loading && <div className="searchbar-hint">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="searchbar-hint">No trains found</div>
          )}
          {results.map((t) => (
            <button
              key={t.number}
              className="searchbar-item"
              onMouseDown={() => selectTrain(t)}
            >
              <span className="searchbar-number">{t.number}</span>
              <span className="searchbar-name">
                {t.name}
                <small>
                  {t.from} → {t.to}
                </small>
              </span>
              <span className={`badge ${t.status === "On Time" ? "badge-on-time" : "badge-delayed"}`}>
                {t.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
