import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client.js";
import LiveMap from "../components/LiveMap.jsx";
import AnimatedCounter from "../components/AnimatedCounter.jsx";

const POPULAR_TRAINS = [
  { number: "12301", name: "Howrah Rajdhani", type: "Rajdhani" },
  { number: "22436", name: "Vande Bharat Exp", type: "Vande Bharat" },
  { number: "12951", name: "Mumbai Tejas Rajdhani", type: "Rajdhani" },
  { number: "12004", name: "Lucknow Shatabdi", type: "Shatabdi" },
  { number: "12260", name: "Sealdah Duronto", type: "Duronto" },
  { number: "12626", name: "Kerala Express", type: "Superfast" },
  { number: "11019", name: "Konark Express", type: "Express" },
  { number: "13005", name: "Amritsar Mail", type: "Mail" },
];

export default function LiveTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const trainParam = searchParams.get("train") || "12301";

  const [selectedTrain, setSelectedTrain] = useState(trainParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [liveData, setLiveData] = useState(null);
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Settings
  const [simSpeed, setSimSpeed] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [activeTab, setActiveTab] = useState("tracking"); // 'tracking', 'radar', 'ai', 'timeline'
  const [isSpeaking, setIsSpeaking] = useState(false);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "👋 Hello! I am your RailGaadi Live AI Copilot. Ask me anything about current train speed, location, platform predictions, or delay forecasts!",
      chips: ["📍 Where is the train?", "⏱️ Delay Forecast", "🚉 Next Stop Platform", "🍲 Food & Pantry"],
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Update URL param when train changes
  useEffect(() => {
    setSearchParams({ train: selectedTrain });
  }, [selectedTrain, setSearchParams]);

  // Fetch live train data
  const fetchLiveData = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getTrainLive(selectedTrain, simSpeed);
      setLiveData(data);
    } catch (err) {
      console.error("Live fetch error:", err);
      setError("Unable to track train. Please verify the train number.");
    } finally {
      setLoading(false);
    }
  }, [selectedTrain, simSpeed]);

  // Fetch nationwide fleet data for radar mode
  const fetchFleet = useCallback(async () => {
    try {
      const res = await api.getLiveRadar(simSpeed);
      if (res?.fleet) {
        setFleetData(res.fleet);
      }
    } catch (err) {
      console.error("Fleet radar error:", err);
    }
  }, [simSpeed]);

  useEffect(() => {
    setLoading(true);
    fetchLiveData();
    fetchFleet();
  }, [fetchLiveData, fetchFleet]);

  // Auto refresh interval with visual countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchLiveData();
          fetchFleet();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLiveData, fetchFleet]);

  // Search input handler with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchTrains(searchQuery);
        setSearchResults(res.slice(0, 8));
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Text-To-Speech Authentic Railway Station Announcement
  const playStationAnnouncement = () => {
    if (!window.speechSynthesis || !liveData) return;
    window.speechSynthesis.cancel();

    const t = liveData.train;
    const nextSt = liveData.nextStation?.name || "destination";
    const plat = liveData.nextStation?.platform || liveData.currentPlatform || 1;
    const delay = t.delay;

    const announcementText = delay > 0
      ? `Attention please! Train number ${t.number}, ${t.name}, is currently running delayed by ${delay} minutes. It is approaching ${nextSt} on Platform number ${plat}. Passengers are requested to be ready.`
      : `May I have your attention please! Train number ${t.number}, ${t.name}, is currently running right on time. Next scheduled arrival is ${nextSt} on Platform number ${plat}. Thank you.`;

    const utterance = new SpeechSynthesisUtterance(announcementText);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;

    // Try finding an English Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find((v) => v.lang.includes("en-IN")) || voices.find((v) => v.lang.includes("en"));
    if (inVoice) utterance.voice = inVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopAnnouncement = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // AI Chat handler
  const handleSendChat = async (queryText) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = { id: Date.now(), sender: "user", text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.ai.assistant(textToSend, selectedTrain);
      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: res.reply || "I couldn't process your request. Please try asking about train status or delays.",
        chips: res.chips || [],
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "I'm having trouble retrieving live neural data right now. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const {
    train,
    telemetry,
    livePosition,
    progress = 0,
    distanceCovered = 0,
    distanceRemaining = 0,
    totalDistance = 0,
    currentStation,
    nextStation,
    destination,
    upcoming = [],
    passed = [],
    aiPrediction,
  } = liveData || {};

  return (
    <div className="live-command-center">
      {/* =====================================================
          TOP STATUS & TELEMETRY STREAM BAR
      ===================================================== */}
      <div className="live-telemetry-header glass-card">
        <div className="live-telemetry-status-group">
          <div className="pulse-indicator">
            <span className="pulse-dot"></span>
            <span className="pulse-text">LIVE SATELLITE TELEMETRY</span>
          </div>
          <div className="telemetry-stat-badge">
            <span className="badge-label">SATELLITES</span>
            <strong>{telemetry?.satellites || 14} LOCKED (NavIC)</strong>
          </div>
          <div className="telemetry-stat-badge">
            <span className="badge-label">REFRESH</span>
            <button
              className="refresh-pill-btn"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Click to toggle auto-refresh"
            >
              {autoRefresh ? `⚡ ${refreshCountdown}s` : "⏸️ PAUSED"}
            </button>
          </div>
        </div>

        <div className="live-telemetry-controls-group">
          {/* Simulation Speed */}
          <div className="sim-speed-selector">
            <span className="control-label">Speed:</span>
            {[1, 5, 10].map((s) => (
              <button
                key={s}
                className={`speed-chip ${simSpeed === s ? "active" : ""}`}
                onClick={() => setSimSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Voice Announcement Audio Button */}
          <button
            className={`btn btn-announcement ${isSpeaking ? "speaking-active" : ""}`}
            onClick={isSpeaking ? stopAnnouncement : playStationAnnouncement}
          >
            {isSpeaking ? "⏹️ Stop Audio" : "🔊 Station Announcement"}
          </button>
        </div>
      </div>

      {/* =====================================================
          QUICK SELECT & SEARCH TRAIN DECK
      ===================================================== */}
      <div className="live-train-selection-strip glass-card">
        <div className="popular-trains-carousel">
          <span className="carousel-title">Active Trains:</span>
          {POPULAR_TRAINS.map((pt) => (
            <button
              key={pt.number}
              className={`popular-train-chip ${selectedTrain === pt.number ? "active" : ""}`}
              onClick={() => {
                setSelectedTrain(pt.number);
                setSearchQuery("");
              }}
            >
              <span className="pt-icon">🚆</span>
              <span className="pt-number">{pt.number}</span>
              <span className="pt-name">{pt.name}</span>
            </button>
          ))}
        </div>

        {/* Search input with live dropdown */}
        <div className="live-search-wrapper">
          <input
            type="text"
            className="live-search-input"
            placeholder="Search train name or number (e.g. 12301, Rajdhani, Vande Bharat)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}

          {searchResults.length > 0 && (
            <div className="live-search-dropdown glass-card">
              {searchResults.map((st) => (
                <div
                  key={st.number}
                  className="search-result-item"
                  onClick={() => {
                    setSelectedTrain(st.number);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <div className="search-result-top">
                    <strong>{st.name}</strong> ({st.number})
                    <span className="badge badge-sm">{st.type}</span>
                  </div>
                  <div className="search-result-route">
                    {st.from} → {st.to}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          NAVIGATION TABS
      ===================================================== */}
      <div className="live-nav-tabs">
        {[
          { id: "tracking", label: "🗺️ Live Train Tracker & Map" },
          { id: "radar", label: "🛰️ Nationwide Radar (Fleet Mode)" },
          { id: "ai", label: "🤖 AI Delay Intelligence & Copilot" },
          { id: "timeline", label: "🚉 Live Station Timeline & Stops" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`live-nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !liveData ? (
        <div className="live-loading-state glass-card">
          <div className="radar-spinner"></div>
          <h2>Locking onto Train Satellite Telemetry...</h2>
          <p>Connecting to Real-time Railway Track Sensors and AI Neural Engine</p>
        </div>
      ) : error ? (
        <div className="live-error-state glass-card">
          <div className="error-icon">⚠️</div>
          <h2>{error}</h2>
          <button
            className="btn btn-primary"
            onClick={() => setSelectedTrain("12301")}
          >
            Switch to 12301 Howrah Rajdhani
          </button>
        </div>
      ) : (
        <div className="live-main-content">
          {/* =====================================================
              PRIMARY TELEMETRY HERO DECK
          ===================================================== */}
          <div className="live-train-hero-card glass-card">
            <div className="train-hero-header">
              <div className="train-hero-identity">
                <span className="train-class-badge">{train?.type || "Express"}</span>
                <h1 className="train-hero-name">{train?.name}</h1>
                <div className="train-hero-meta">
                  <span className="train-hero-number">#{train?.number}</span>
                  <span className="train-hero-route">
                    {train?.from} ➔ {train?.to}
                  </span>
                </div>
              </div>

              <div className="train-hero-speedometer">
                <div className="speedometer-box">
                  <span className="speedometer-value">
                    {telemetry?.speedKmH || 0}
                  </span>
                  <span className="speedometer-unit">KM/H</span>
                </div>
                <div className="speed-status-indicator">
                  <span
                    className="signal-dot"
                    style={{ backgroundColor: telemetry?.signalColor || "#10b981" }}
                  ></span>
                  <strong style={{ color: telemetry?.signalColor || "#10b981" }}>
                    SIGNAL: {telemetry?.signal || "CLEAR"}
                  </strong>
                  <small>{telemetry?.dwellStatus || "Cruising"}</small>
                </div>
              </div>
            </div>

            {/* Live Progress Bar with Micro Details */}
            <div className="live-progress-deck">
              <div className="progress-labels">
                <span>📍 Current: <strong>{currentStation?.name || train?.from}</strong></span>
                <span className="progress-pct">{progress}% Journey Complete</span>
                <span>🏁 Destination: <strong>{destination?.name || train?.to}</strong></span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                >
                  <span className="progress-train-head">🚅</span>
                </div>
              </div>
              <div className="progress-metrics-row">
                <div className="metric-cell">
                  <span className="metric-label">Covered</span>
                  <strong>{distanceCovered} km</strong>
                </div>
                <div className="metric-cell">
                  <span className="metric-label">Remaining</span>
                  <strong>{distanceRemaining} km</strong>
                </div>
                <div className="metric-cell">
                  <span className="metric-label">Total Route</span>
                  <strong>{totalDistance} km</strong>
                </div>
                <div className="metric-cell">
                  <span className="metric-label">Next Stop ETA</span>
                  <strong className="text-highlight">
                    {nextStation ? `~${nextStation.etaMinutes} mins` : "Arrived"}
                  </strong>
                </div>
                <div className="metric-cell">
                  <span className="metric-label">Running Status</span>
                  <strong className={train?.delay > 0 ? "text-danger" : "text-success"}>
                    {train?.status} {train?.delay > 0 ? `(+${train?.delay}m)` : ""}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              TAB 1: LIVE TRAIN TRACKER & MAP
          ===================================================== */}
          {activeTab === "tracking" && (
            <div className="live-tracking-layout">
              {/* Left Column: Interactive Map */}
              <div className="map-view-wrapper glass-card">
                <LiveMap
                  mapData={liveData}
                  selectedTrainNumber={selectedTrain}
                  zoom={7}
                />
              </div>

              {/* Right Column: Next Station & Real-time AI Forecast Deck */}
              <div className="live-side-deck">
                {/* Next Station Spotlight Card */}
                <div className="glass-card next-station-card">
                  <div className="card-badge">NEXT SCHEDULED STOP</div>
                  <h3 className="next-station-title">
                    {nextStation?.name || destination?.name || "Terminus"}
                  </h3>
                  <div className="next-station-meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Code</span>
                      <strong>{nextStation?.code || destination?.code}</strong>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Platform</span>
                      <strong className="platform-number">
                        Platform {nextStation?.platform || destination?.platform || 1}
                      </strong>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Est. Arrival</span>
                      <strong>~{nextStation?.etaMinutes || 25} minutes</strong>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Distance</span>
                      <strong>{nextStation?.distanceKm || 32} km ahead</strong>
                    </div>
                  </div>
                </div>

                {/* AI Neural Delay Predictor Card */}
                {aiPrediction && (
                  <div className="glass-card ai-prediction-card">
                    <div className="ai-card-header">
                      <span className="ai-glow-tag">🤖 NEURAL AI PREDICTION</span>
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

                      <p className="ai-pred-note">
                        {aiPrediction.recommendation}
                      </p>

                      <div className="ai-factors-grid">
                        <div className="ai-factor-item">
                          <span>Recovery Potential:</span>
                          <strong>{aiPrediction.recoveryPotentialMinutes > 0 ? `-${aiPrediction.recoveryPotentialMinutes}m` : "Optimal"}</strong>
                        </div>
                        <div className="ai-factor-item">
                          <span>Route Risk:</span>
                          <strong className={`risk-${aiPrediction.riskLevel.toLowerCase()}`}>
                            {aiPrediction.riskLevel}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Locomotive Technical Specs Card */}
                <div className="glass-card loco-specs-card">
                  <div className="card-badge">LOCOMOTIVE & TELEMETRY</div>
                  <div className="loco-specs-grid">
                    <div>
                      <span className="spec-label">Locomotive</span>
                      <strong>{telemetry?.locomotive || "WAP-7"}</strong>
                    </div>
                    <div>
                      <span className="spec-label">Class</span>
                      <strong>{telemetry?.locoClass || "6000 HP 3-Phase"}</strong>
                    </div>
                    <div>
                      <span className="spec-label">Traction</span>
                      <strong>{telemetry?.traction || "25 kV AC Catenary"}</strong>
                    </div>
                    <div>
                      <span className="spec-label">Protection</span>
                      <strong>{telemetry?.safetySystem || "KAVACH Active"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              TAB 2: NATIONWIDE LIVE RADAR (FLEET MODE)
          ===================================================== */}
          {activeTab === "radar" && (
            <div className="radar-fleet-layout">
              <div className="glass-card radar-info-banner">
                <div className="radar-banner-left">
                  <h3>🛰️ Nationwide Real-time Train Radar Fleet</h3>
                  <p>
                    Showing {fleetData.length} active express, Rajdhani, and Vande Bharat trains currently running across Indian Railways. Click any train on the radar to track it instantly!
                  </p>
                </div>
                <div className="radar-banner-right">
                  <span className="badge badge-on-time">⚡ Realtime GPS Streaming</span>
                </div>
              </div>

              <div className="radar-map-container glass-card">
                <LiveMap
                  mapData={null}
                  fleet={fleetData}
                  selectedTrainNumber={selectedTrain}
                  onSelectFleetTrain={(num) => {
                    setSelectedTrain(num);
                    setActiveTab("tracking");
                  }}
                  zoom={5}
                />
              </div>

              {/* Fleet List Table */}
              <div className="fleet-list-grid">
                {fleetData.map((f) => (
                  <div
                    key={f.number}
                    className={`glass-card fleet-card ${selectedTrain === f.number ? "active-train" : ""}`}
                    onClick={() => {
                      setSelectedTrain(f.number);
                      setActiveTab("tracking");
                    }}
                  >
                    <div className="fleet-card-top">
                      <strong className="fleet-card-num">{f.number}</strong>
                      <span className="badge badge-sm">{f.type}</span>
                      <span className={f.status === "On Time" ? "text-success font-bold" : "text-danger font-bold"}>
                        {f.status} {f.delay > 0 ? `(+${f.delay}m)` : ""}
                      </span>
                    </div>
                    <div className="fleet-card-name">{f.name}</div>
                    <div className="fleet-card-route">
                      {f.from} ➔ {f.to}
                    </div>
                    <div className="fleet-card-stats">
                      <span>Speed: <strong>{f.speedKmH} km/h</strong></span>
                      <span>Next: <strong>{f.nextStation}</strong></span>
                    </div>
                    <button className="btn btn-sm btn-primary mt-2">
                      🎯 Track Train Live
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================
              TAB 3: AI INTELLIGENCE & COPILOT CHAT
          ===================================================== */}
          {activeTab === "ai" && (
            <div className="ai-workspace-layout">
              {/* Left Column: Deep Neural Prediction Report */}
              <div className="ai-report-column">
                <div className="glass-card ai-detailed-report">
                  <div className="ai-report-header">
                    <h2>🤖 AI Route Neural Health & Punctuality Diagnostics</h2>
                    <span className="ai-score-badge">
                      Punctuality Score: {aiPrediction?.onTimeProbabilityPercent || 94}%
                    </span>
                  </div>

                  <p className="ai-lead-paragraph">
                    {aiPrediction?.recommendation}
                  </p>

                  <h4 className="mt-4 mb-2">Key Route Risk Drivers Evaluated:</h4>
                  <div className="ai-factors-deck">
                    {aiPrediction?.factors?.map((fact, idx) => (
                      <div key={idx} className="ai-factor-card glass-card">
                        <div className="factor-header">
                          <strong>{fact.name}</strong>
                          <span className="badge badge-on-time">{fact.status}</span>
                        </div>
                        <p className="factor-impact">{fact.impact}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="mt-4 mb-2">Upcoming Interchanges & Bottleneck Clearance:</h4>
                  <div className="bottlenecks-list">
                    {aiPrediction?.bottlenecks?.map((bn, idx) => (
                      <div key={idx} className="bottleneck-item glass-card">
                        <div>
                          <strong>{bn.station} ({bn.code})</strong>
                          <p className="text-sub mb-0">{bn.note}</p>
                        </div>
                        <div className="text-right">
                          <span className={`risk-tag risk-${bn.risk.toLowerCase()}`}>
                            Risk: {bn.risk}
                          </span>
                          <div className="text-sm">Platform: {bn.scheduledPlatform}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive AI Copilot Chat */}
              <div className="ai-chat-column glass-card">
                <div className="chat-header">
                  <div className="chat-avatar">🤖</div>
                  <div>
                    <h3 className="chat-title">RailGaadi Travel Copilot</h3>
                    <span className="chat-status">Online • Answering for #{selectedTrain}</span>
                  </div>
                </div>

                <div className="chat-messages-container">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-bubble-wrapper ${msg.sender === "user" ? "user-wrapper" : "ai-wrapper"}`}
                    >
                      <div className={`chat-bubble ${msg.sender === "user" ? "user-bubble" : "ai-bubble"}`}>
                        <div className="chat-text" style={{ whiteSpace: "pre-line" }}>
                          {msg.text}
                        </div>
                      </div>

                      {msg.chips && msg.chips.length > 0 && (
                        <div className="chat-chips-deck">
                          {msg.chips.map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              className="chat-prompt-chip"
                              onClick={() => handleSendChat(chip)}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-bubble-wrapper ai-wrapper">
                      <div className="chat-bubble ai-bubble typing-bubble">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="chat-input-bar"
                >
                  <input
                    type="text"
                    className="chat-text-input"
                    placeholder="Ask about live status, platforms, weather, food, delays..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary chat-send-btn">
                    ➤
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* =====================================================
              TAB 4: LIVE STATION TIMELINE & STOPS
          ===================================================== */}
          {activeTab === "timeline" && (
            <div className="timeline-layout glass-card">
              <div className="timeline-header">
                <h2>🚉 Live Route Station Stops & Scheduled Halts</h2>
                <p>
                  Real-time progression timeline along {train?.name} ({train?.number}) route.
                </p>
              </div>

              <div className="vertical-timeline">
                {/* Passed Stations */}
                {passed.map((st, i) => (
                  <div key={st.code} className="timeline-stop passed-stop">
                    <div className="timeline-marker passed-marker">✓</div>
                    <div className="timeline-info">
                      <div className="stop-name-row">
                        <strong>{st.name}</strong> ({st.code})
                        <span className="badge badge-sm">Departed</span>
                      </div>
                      <div className="stop-meta">
                        Platform {st.platform} • {st.state}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Current Station */}
                {currentStation && (
                  <div className="timeline-stop current-stop">
                    <div className="timeline-marker current-marker">📍</div>
                    <div className="timeline-info highlight-info">
                      <div className="stop-name-row">
                        <strong className="text-xl">{currentStation.name}</strong> ({currentStation.code})
                        <span className="badge badge-on-time">CURRENT TRAIN LOCATION</span>
                      </div>
                      <div className="stop-meta">
                        Platform: <strong>{currentStation.platform}</strong> • {currentStation.state}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Stations */}
                {upcoming.map((st, i) => (
                  <div key={st.code} className={`timeline-stop upcoming-stop ${i === 0 ? "next-immediate" : ""}`}>
                    <div className="timeline-marker upcoming-marker">{i === 0 ? "⏭️" : "○"}</div>
                    <div className="timeline-info">
                      <div className="stop-name-row">
                        <strong>{st.name}</strong> ({st.code})
                        {i === 0 && <span className="badge badge-warning">Next Stop</span>}
                      </div>
                      <div className="stop-meta">
                        Platform {st.platform} • ETA: <strong>~{st.etaMinutes} mins</strong> ({st.arrivalTimeFormatted}) • {st.distanceRemaining} km remaining
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
