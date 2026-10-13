import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useApp();

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/train/${query.trim()}`);
      setQuery("");
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
        <img src="https://cdn-icons-png.flaticon.com/128/1034/1034693.png" alt="RailGaadi logo" className="brand-icon" />
        <span className="brand-text">Rail<span className="brand-gaadi">Gaadi</span></span>
      </Link>

      <form onSubmit={onSearch} className="navbar-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search train number or name..."
          className="navbar-input"
        />
        <button type="submit" className="btn btn-primary navbar-btn">🔍</button>
      </form>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>
        <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/trains" className="nav-link" onClick={() => setMenuOpen(false)}>Trains</Link>
        <Link to="/stations" className="nav-link" onClick={() => setMenuOpen(false)}>Stations</Link>
        <Link to="/live" className="nav-link" onClick={() => setMenuOpen(false)}>Live Tracking</Link>
        <Link to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>About RailGaadi</Link>

        {user ? (
          <div className="navbar-user">
            <span className="navbar-user-name" title={user.email}>
              👤 {user.name}
            </span>
            <Link to="/dashboard" className="btn navbar-btn" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <button className="btn navbar-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="navbar-user">
            <Link to="/auth?mode=login" className="btn navbar-action-btn navbar-login-btn" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <Link to="/auth?mode=register" className="btn navbar-action-btn navbar-register-btn" onClick={() => setMenuOpen(false)}>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
