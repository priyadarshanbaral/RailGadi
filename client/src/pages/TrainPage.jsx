import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client.js";
import { useApp } from "../context/AppContext.jsx";
import LiveMap from "../components/LiveMap.jsx";
import Analytics from "../components/Analytics.jsx";
import Companion from "../components/Companion.jsx";
import AnimatedCounter from "../components/AnimatedCounter.jsx";
import { SkeletonDashboard } from "../components/Skeleton.jsx";

export default function TrainPage() {
  const { number } = useParams();
  const [live, setLive] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("status");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { addRecentSearch, isFavorite, toggleFavorite } = useApp();

  const fetchData = useCallback(async () => {
    try {
      const [liveRes, mapRes, anaRes, compRes] = await Promise.all([
        api.getTrainLive(number),
        api.getMapData(number),
        api.getAnalytics(number),
        api.getCompanion(number),
      ]);
      setLive(liveRes);
      setMapData(mapRes);
      setAnalytics(anaRes);
      setCompanion(compRes);
      addRecentSearch({
        number: liveRes.train.number,
        name: liveRes.train.name,
        from: liveRes.train.from,
        to: liveRes.train.to,
      });
      setError(null);
    } catch (e) {
      setError("Train not found. Please check the train number.");
    } finally {
      setLoading(false);
    }
  }, [number, addRecentSearch]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      api.getTrainLive(number).then(setLive).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, number]);

  if (error) {
    return (
      <div className="error-state glass-card">
        <div className="error-icon">🚫</div>
        <h2>{error}</h2>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  if (loading || !live) {
    return (
      <div className="train-page">
        <SkeletonDashboard />
        <div className="glass-card" style={{ marginTop: 20 }}>
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

const {
  train,
  telemetry = {},
  aiPrediction = {},
  currentStation,
  nextStation,
  destination,
  currentPlatform,
  livePosition,
  progress,
  distanceCovered,
  distanceRemaining,
  totalDistance,
  lastUpdate,
  upcoming,
} = live;
  const fav = isFavorite(train.number);

  const tabs = [
    { id: "status", label: "📍 Live Status & AI" },
    { id: "map", label: "🗺️ Journey Map" },
    { id: "analytics", label: "📊 Analytics" },
    { id: "companion", label: "🤖 Companion" },
  ];

  const shareJourney = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${train.name} Live Status`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Journey link copied to clipboard!");
    }
  };

  const playAnnouncement = () => {
    if (!window.speechSynthesis) return;
    const msg = train.delay > 0
      ? `Attention please! Train number ${train.number}, ${train.name}, is running delayed by ${train.delay} minutes. Approaching ${nextStation?.name || "destination"} on Platform ${nextStation?.platform || currentPlatform || 1}.`
      : `May I have your attention please! Train number ${train.number}, ${train.name}, is running right on time. Next arrival is ${nextStation?.name || "destination"} on Platform ${nextStation?.platform || currentPlatform || 1}.`;
    const u = new SpeechSynthesisUtterance(msg);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="train-page">
      {/* Header */}
      <motion.div className="glass-card train-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="train-header-top">
          <div>
            <h1 className="train-title">{train.name}</h1>
            <div className="train-subtitle">
              <span className="badge train-type">{train.type}</span>
              <span className={`badge ${train.status === "On Time" ? "badge-on-time" : "badge-delayed"}`}>
                {train.status}
                {train.delay > 0 && ` +${train.delay} min`}
              </span>
              {telemetry?.speedKmH !== undefined && (
                <span className="badge badge-on-time">
                  ⚡ {telemetry.speedKmH} km/h
                </span>
              )}
            </div>
          </div>
          <div className="train-header-actions">
            <Link to={`/live?train=${train.number}`} className="btn btn-primary">
              🛰️ Live AI Radar
            </Link>
            <button className="btn" onClick={playAnnouncement}>
              🔊 Announcement
            </button>
            <button className="btn" onClick={() => toggleFavorite(train)}>
              {fav ? "★ Favourite" : "☆ Add Favourite"}
            </button>
            <button className="btn" onClick={shareJourney}>
              🔗 Share
            </button>
          </div>
        </div>

        <div className="train-header-stats">
          <div className="header-stat">
            <span className="header-stat-label">Progress</span>
            <AnimatedCounter value={progress} suffix="%" />
          </div>
          <div className="header-stat">
            <span className="header-stat-label">Live Speed</span>
            <strong>{telemetry?.speedKmH || 0} km/h</strong>
          </div>
          <div className="header-stat">
            <span className="header-stat-label">Distance Covered</span>
            <AnimatedCounter value={distanceCovered} suffix=" km" />
          </div>
          <div className="header-stat">
            <span className="header-stat-label">Remaining</span>
            <AnimatedCounter value={distanceRemaining} suffix=" km" />
          </div>
          <div className="header-stat">
            <span className="header-stat-label">Total</span>
            <AnimatedCounter value={totalDistance} suffix=" km" />
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-labels">
          <span>{currentStation?.name}</span>
          <span>{progress}%</span>
          <span>{nextStation?.name || "Destination"}</span>
        </div>
      </motion.div>

      {/* Current / Next / Destination station cards */}
      <div className="grid grid-3 station-cards">
        <div className="glass-card station-card current">
          <div className="station-card-label">📍 Current Station</div>
          <div className="station-card-name">{currentStation?.name}</div>
          <div className="station-card-code">
            {currentStation?.code} • {currentStation?.state}
            {currentPlatform ? ` • Platform ${currentPlatform}` : ""}
          </div>
        </div>
        <div className="glass-card station-card next">
          <div className="station-card-label">🚉 Next Station</div>
          <div className="station-card-name">{nextStation?.name || "Destination"}</div>
          <div className="station-card-code">
            {nextStation ? `${nextStation.code} • Arriving in ~45 min` : "Journey complete"}
          </div>
        </div>
        <div className="glass-card station-card destination">
          <div className="station-card-label">🏁 Destination</div>
          <div className="station-card-name">{destination?.name}</div>
          <div className="station-card-code">
            {destination?.code} • {destination?.state}
            {destination?.platform ? ` • Platform ${destination.platform}` : ""}
          </div>
        </div>
      </div>

      {/* Live GPS position */}
      {livePosition && (
        <div className="glass-card gps-card">
          <span className="gps-label">📡 Live GPS Location</span>
          <strong className="gps-coords">
            {livePosition.lat}, {livePosition.lng}
          </strong>
          <a
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps?q=${livePosition.lat},${livePosition.lng}`}
          >
            Open in Google Maps
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === "status" && (
          <div className="fade-in-up">
            <div className="glass-card status-card">
              <div className="status-head">
                <h3>Live Running Status</h3>
                <span className="status-updated">Updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
              </div>
              <div className="status-rows">
                <div className="status-row">
                  <span>Current Station</span>
                  <strong>{currentStation?.name}</strong>
                </div>
                <div className="status-row">
                  <span>Next Station</span>
                  <strong>{nextStation?.name || "—"}</strong>
                </div>
                <div className="status-row">
                  <span>Running Status</span>
                  <strong className={train.status === "On Time" ? "text-success" : "text-danger"}>
                    {train.status}
                  </strong>
                </div>
                <div className="status-row">
                  <span>ETA to Next Station</span>
                  <strong>~45 min</strong>
                </div>
                <div className="status-row">
                  <span>Distance Remaining</span>
                  <strong>{distanceRemaining} km</strong>
                </div>
              </div>
            </div>

            {/* AI Neural Prediction Card */}
            {aiPrediction && (
              <div className="glass-card ai-prediction-card" style={{ marginTop: 20 }}>
                <div className="ai-card-header">
                  <span className="ai-glow-tag">🤖 NEURAL AI DELAY FORECAST</span>
                  <span className="ai-confidence-tag">
                    {aiPrediction.confidencePercent}% Confidence
                  </span>
                </div>
                <div className="ai-prediction-body">
                  <div className="ai-prediction-main">
                    <span className="ai-pred-label">Projected Final Delay at Terminus:</span>
                    <h2 className={aiPrediction.predictedFinalDelay > 0 ? "text-danger" : "text-success"}>
                      {aiPrediction.predictedFinalDelay > 0
                        ? `+${aiPrediction.predictedFinalDelay} min delayed`
                        : "Right on Time (0 min delay)"}
                    </h2>
                  </div>
                  <p className="ai-pred-note">{aiPrediction.recommendation}</p>
                  <div className="ai-factors-grid">
                    <div className="ai-factor-item">
                      <span>Recovery Potential:</span>
                      <strong>
                        {aiPrediction.recoveryPotentialMinutes > 0
                          ? `-${aiPrediction.recoveryPotentialMinutes}m`
                          : "Optimal"}
                      </strong>
                    </div>
                    <div className="ai-factor-item">
                      <span>Route Risk Level:</span>
                      <strong className={`risk-${aiPrediction.riskLevel.toLowerCase()}`}>
                        {aiPrediction.riskLevel}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming stations */}
            <div className="glass-card" style={{ marginTop: 20 }}>
              <h3 className="chart-title">Upcoming Stations</h3>
              <div className="upcoming-list">
                {upcoming.map((s, i) => (
                  <div className="upcoming-row" key={i}>
                    <span className="upcoming-order">{i + 1}</span>
                    <span className="upcoming-name">{s.name}</span>
                    <span className="upcoming-code">{s.code}</span>
                    <span className="upcoming-eta">ETA ~{s.etaMinutes} min</span>
                    <span className="upcoming-dist">{s.distanceRemaining} km</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="auto-refresh">
              <label className="switch">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                <span className="slider"></span>
              </label>
              <span>Auto refresh (30s)</span>
            </div>
          </div>
        )}

        {activeTab === "map" && (
          <div className="fade-in-up">
            <LiveMap mapData={mapData} />
            <div className="map-link">
              <Link to={`/map/${train.number}`} className="btn btn-primary">
                Open Fullscreen Map 🗺️
              </Link>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="fade-in-up">
            <Analytics data={analytics} />
          </div>
        )}

        {activeTab === "companion" && (
          <div className="fade-in-up">
            <Companion data={companion} />
          </div>
        )}
      </div>
    </div>
  );
}
