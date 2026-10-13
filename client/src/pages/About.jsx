import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Features from "../components/Features.jsx";

// About RailGaadi page — explains the project, what problem it solves, tech
// stack and the team behind it.
export default function About() {
  return (
    <div className="data-page fade-in-up">
      <motion.div
        className="glass-card data-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="data-title">ℹ️ About RailGaadi</h1>
        <p className="data-sub">
          RailGaadi is your smart railway travel companion built with the modern
          MERN stack.
        </p>
      </motion.div>

      <section className="home-section">
        <div className="glass-card about-card">
          <p className="about-description">
            <strong>RailGaadi</strong> solves the everyday problem of not knowing
            where your train is, when it will arrive, or the best way to plan a
            rail journey. It brings live train tracking, station and route
            search, interactive journey maps, analytics and a smart travel
            companion into a single, beautiful platform.
          </p>
          <p className="about-description">
            Train and station information is <strong>free to explore without an
            account</strong>. Registering creates a personalised Space with a
            unique <strong>User ID (e.g. RG10001)</strong>, a branded welcome
            email, and access to your dashboard.
          </p>
        </div>
      </section>

      <Features />

      <section className="home-section">
        <div className="features-head">
          <h2 className="section-title">🛠️ Built With</h2>
        </div>
        <div className="stack-grid">
          {[
            { icon: "⚛️", name: "React", desc: "Modern component-driven UI" },
            { icon: "🌐", name: "Node.js + Express", desc: "Fast REST API backend" },
            { icon: "🍃", name: "MongoDB", desc: "Secure user data storage" },
            { icon: "📧", name: "Nodemailer", desc: "Branded welcome emails" },
            { icon: "🗺️", name: "Leaflet", desc: "Interactive railway maps" },
            { icon: "📈", name: "Recharts", desc: "Journey analytics charts" },
          ].map((s, i) => (
            <motion.div
              className="glass-card stack-card"
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08 }}
            >
              <span className="feature-icon">{s.icon}</span>
              <strong>{s.name}</strong>
              <small>{s.desc}</small>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="train-see-all">
        <Link to="/" className="btn">
          🏠 Back to Home
        </Link>
      </div>
    </div>
  );
}
