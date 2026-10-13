import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";

export default function TrainCard({ train }) {
  const { isFavorite, toggleFavorite } = useApp();
  const fav = isFavorite(train.number);

  return (
    <motion.div
      className="glass-card train-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <div className="train-card-head">
        <div className="train-number">{train.number}</div>
        <button
          className={`fav-btn ${fav ? "fav-active" : ""}`}
          onClick={() => toggleFavorite(train)}
          aria-label="Toggle favorite"
        >
          {fav ? "★" : "☆"}
        </button>
      </div>
<h3 className="train-name">{train.name}</h3>
      <div className="train-route">
        <span className="train-route-station">
          <strong>{train.fromCode || train.from}</strong>
          <small>{train.from}</small>
        </span>
        <span className="route-arrow">→</span>
        <span className="train-route-station">
          <strong>{train.toCode || train.to}</strong>
          <small>{train.to}</small>
        </span>
      </div>
      <div className="train-destination">
        <span className="badge train-type">{train.type}</span>
        {train.destination && (
          <span className="train-platform">
            🛤️ {train.destination.name} · Platform {train.destination.platform}
          </span>
        )}
      </div>
      <div className="train-card-foot">
        <span className={`badge ${train.status === "On Time" ? "badge-on-time" : "badge-delayed"}`}>
          {train.status}
          {train.delay > 0 ? ` +${train.delay} min` : ""}
        </span>
        {train.livePosition && (
          <span className="train-live-gps">
            📡 {train.livePosition.lat}, {train.livePosition.lng}
          </span>
        )}
      </div>
      <Link to={`/train/${train.number}`} className="btn btn-primary train-view">
        View Live Status
      </Link>
    </motion.div>
  );
}
