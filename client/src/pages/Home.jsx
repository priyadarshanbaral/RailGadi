import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

import Features from "../components/Features.jsx";
import TrainDetailsSection from "../components/TrainDetailsSection.jsx";
import StationSection from "../components/StationSection.jsx";
import AuthSection from "../components/AuthSection.jsx";
import TrainCard from "../components/TrainCard.jsx";
import RouteSearch from "../components/RouteSearch.jsx";

import heroTrain from "./hero-train.jpg";

export default function Home() {
  const { user, favorites, recentSearches } = useApp();

  return (
    <div className="home">

      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section
        className="hero"
        style={{
          backgroundImage: `url("${heroTrain}")`,
        }}
      >

        {/* Dark overlay */}
        <div className="hero-overlay"></div>

        {/* Hero Content */}
        <motion.div
          className="hero-inner"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        >

          <span className="hero-badge">
            🚆 RAILGAADI
          </span>

          <h1 className="hero-title">
            Your Smart
            <br />

            <span className="gradient-text">
              Railway Travel
            </span>

            <br />

            Companion
          </h1>

          <p className="hero-sub">
            Track trains, explore railway routes, check train
            information and manage your journey — all from one
            powerful platform.
          </p>

          <div className="hero-cta">

            <Link
              to="/live"
              className="btn btn-primary"
            >
              🛰️ Live AI Train Radar
            </Link>

            <a
              href="#trains"
              className="btn btn-outline"
            >
              Browse Trains
            </a>

          </div>

        </motion.div>


        {/* =====================================================
            HERO STATISTICS
        ===================================================== */}

        <div className="hero-stats">

          {[
            {
              n: "Live",
              l: "Train Tracking",
            },
            {
              n: "100k+",
              l: "Trains Covered",
            },
            {
              n: "8k+",
              l: "Stations",
            },
            {
              n: "24/7",
              l: "Status Updates",
            },
          ].map((s, i) => (

            <motion.div
              className="hero-stat"
              key={i}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.3 + i * 0.1,
                duration: 0.5,
              }}
            >
              <strong>
                {s.n}
              </strong>
              <small>
                {s.l}
              </small>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =====================================================
          LIVE AI TRAIN TRACKING SPOTLIGHT SECTION
      ===================================================== */}
      <section className="home-section fade-in-up">
        <div className="features-head">
          <span className="hero-badge">🔴 REAL-TIME AI RADAR</span>
          <h2 className="section-title">⚡ Real-time Live Train Tracking & AI Copilot</h2>
          <p className="features-sub">
            Track any train live with NavIC satellite GPS telemetry, dynamic speedometer gauges, AI delay predictions, and station voice announcements.
          </p>
        </div>

        <div className="glass-card live-home-spotlight">
          <div className="spotlight-left">
            <div className="spotlight-badge">
              <span className="pulse-dot"></span> LIVE TELEMETRY ACTIVE
            </div>
            <h3 className="spotlight-title">12301 • HOWRAH RAJDHANI EXPRESS</h3>
            <p className="spotlight-desc">
              Currently cruising at <strong>115 km/h</strong> approaching New Delhi. AI neural model projects <strong>98% on-time arrival</strong> with automatic signal clearance.
            </p>
            <div className="spotlight-chips">
              <span className="chip">⚡ Live Speedometer</span>
              <span className="chip">🤖 AI Delay Forecast</span>
              <span className="chip">🔊 Spoken Announcements</span>
              <span className="chip">🛰️ Nationwide Radar</span>
            </div>
            <div className="spotlight-actions">
              <Link to="/live?train=12301" className="btn btn-primary">
                🚀 Launch Live Tracking Command Center
              </Link>
              <Link to="/live" className="btn btn-outline">
                🛰️ Open Nationwide Radar Fleet
              </Link>
            </div>
          </div>
          <div className="spotlight-right">
            <div className="spotlight-stats-card">
              <div className="spotlight-stat-row">
                <span>Signal Aspect</span>
                <strong className="text-success">🟢 CLEAR (Max Permissible)</strong>
              </div>
              <div className="spotlight-stat-row">
                <span>Speed Telemetry</span>
                <strong className="text-highlight">115 km/h (WAP-7 6000HP)</strong>
              </div>
              <div className="spotlight-stat-row">
                <span>AI Predicted Delay</span>
                <strong className="text-success">0 min (Right On Time)</strong>
              </div>
              <div className="spotlight-stat-row">
                <span>Satellite Lock</span>
                <strong>14 Satellites (NavIC L1/L5)</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATION TO STATION SEARCH
      ===================================================== */}

      <section className="home-section fade-in-up">
        <div className="features-head">
          <h2 className="section-title">🔍 Find Trains Between Stations</h2>
          <p className="features-sub">
            Search for trains traveling between any two stations across India
          </p>
        </div>
        <RouteSearch />
      </section>


      {/* =====================================================
          ABOUT RAILGAADI
      ===================================================== */}

      <section className="home-section fade-in-up">

        <div className="features-head">

          <h2 className="section-title">
            ℹ️ About RailGaadi
          </h2>

          <p className="features-sub">
            RailGaadi is a full-stack railway platform that
            helps users track trains, explore railway routes
            and plan a smooth journey.
          </p>

        </div>


        <div className="glass-card about-card">

          <p className="about-description">

            Built with the{" "}
            <strong>MERN stack</strong>{" "}
            (MongoDB, Express, React, Node.js), RailGaadi brings{" "}
            <strong>live train tracking</strong>,
            station and route search,
            <strong> interactive journey maps</strong>,
            analytics and a smart travel companion into one
            easy-to-use platform.

            Train and station information is{" "}
            <strong>
              free to explore without an account
            </strong>{" "}
            — registration is only needed for personalised
            features such as your dashboard and saved favourites.

          </p>


          <div className="about-quick">

            <span>
              🛤️ Live GPS tracking
            </span>

            <span>
              🔍 Train &amp; station search
            </span>

            <span>
              🗺️ Journey maps
            </span>

            <span>
              📊 Analytics
            </span>

            <span>
              🔔 Notifications
            </span>

            <span>
              👤 User accounts
            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURES
      ===================================================== */}

      <div id="features">
        <Features />
      </div>


      {/* =====================================================
          TRAIN DETAILS
      ===================================================== */}

      <div id="trains">
        <TrainDetailsSection />
      </div>


      {/* =====================================================
          STATIONS
      ===================================================== */}

      <div id="stations">
        <StationSection />
      </div>


      {/* =====================================================
          LOGIN / REGISTER
      ===================================================== */}

      {!user && (

        <div id="auth">
          <AuthSection />
        </div>

      )}


      {/* =====================================================
          LOGGED-IN CONTENT
      ===================================================== */}

      {user && (

        <>

          {/* Welcome Banner */}

          <section className="home-section fade-in-up">

            <div className="welcome-banner glass-card">

              <span className="welcome-emoji">
                🎉
              </span>

              <div>

                <h3>
                  Welcome back, {user.name}!
                </h3>

                {user.userId && (

                  <p>
                    Your User ID:{" "}
                    <strong>
                      {user.userId}
                    </strong>
                  </p>

                )}

                <p>
                  You are logged in. Here's everything
                  you need to track your journey.
                </p>

              </div>

              <Link
                to="/dashboard"
                className="btn btn-primary"
              >
                Go to Dashboard →
              </Link>

            </div>

          </section>


          {/* Favourite Trains */}

          {favorites.length > 0 && (

            <section className="home-section fade-in-up">

              <h2 className="section-title">
                ⭐ Favourite Trains
              </h2>

              <div className="grid grid-3">

                {favorites.map((t) => (

                  <TrainCard
                    key={t.number}
                    train={t}
                  />

                ))}

              </div>

            </section>

          )}


          {/* Recent Searches */}

          {recentSearches.length > 0 && (

            <section className="home-section fade-in-up">

              <h2 className="section-title">
                🕘 Recent Searches
              </h2>

              <div className="recent-list">

                {recentSearches.map((t) => (

                  <Link
                    to={`/train/${t.number}`}
                    className="recent-item"
                    key={t.number}
                  >

                    <span className="recent-number">
                      {t.number}
                    </span>

                    <span className="recent-name">
                      {t.name}
                    </span>

                    <span className="recent-route">
                      {t.from} → {t.to}
                    </span>

                  </Link>

                ))}

              </div>

            </section>

          )}

        </>

      )}

    </div>
  );
}