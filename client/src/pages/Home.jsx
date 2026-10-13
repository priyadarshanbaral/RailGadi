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

            <a
              href="#features"
              className="btn btn-primary"
            >
              Explore RailGaadi
            </a>

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