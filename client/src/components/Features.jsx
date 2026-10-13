import { motion } from "framer-motion";

// RailGaadi feature showcase — 12 core capabilities presented as animated cards.
const FEATURES = [
  { icon: "🚆", title: "Live Train Tracking", desc: "Follow any train's real-time position anywhere in India." },
  { icon: "🔍", title: "Train Search", desc: "Search instantly by train number or name across thousands of trains." },
  { icon: "🚉", title: "Railway Station Search", desc: "Find stations by code, name or state with full details." },
  { icon: "🗺️", title: "Interactive Railway Map", desc: "Explore complete routes on immersive interactive maps." },
  { icon: "📍", title: "Current Train Location", desc: "Pinpoint a train's exact live location with GPS precision." },
  { icon: "⏱️", title: "Train Running Status", desc: "Know instantly whether a train is on time or delayed." },
  { icon: "🕐", title: "Arrival & Departure Information", desc: "Get scheduled departure & arrival times for every stop." },
  { icon: "📊", title: "Journey Progress", desc: "See distance covered, remaining distance and progress percentage." },
  { icon: "📈", title: "Journey Analytics", desc: "Dive into elevation profiles, delay analysis and statistics." },
  { icon: "🔔", title: "Train Notifications", desc: "Stay updated on the latest status of the trains you follow." },
  { icon: "👤", title: "User Account", desc: "Create a RailGaadi account to personalise your journey experience." },
  { icon: "📱", title: "Responsive Mobile Experience", desc: "Track trains beautifully on any screen — phone, tablet or desktop." },
];

export default function Features() {
  return (
    <section className="home-section">
      <div className="features-head">
        <h2 className="section-title">✨ RailGaadi Features</h2>
        <p className="features-sub">
          Everything you need to plan, track and enjoy your rail journey — all in one place.
        </p>
      </div>

      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <motion.div
            className="feature-card glass-card"
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 4) * 0.08, duration: 0.4 }}
            whileHover={{ y: -6 }}
          >
            <span className="feature-icon">{f.icon}</span>
            <strong className="feature-title">{f.title}</strong>
            <p className="feature-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

