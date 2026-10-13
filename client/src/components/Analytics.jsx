import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import AnimatedCounter from "./AnimatedCounter.jsx";

export default function Analytics({ data }) {
  if (!data) return null;

  const { elevation, distance, completion, delayStatus, delayMinutes, timeline, arrivalHistory } = data;

  const elevationData = elevation.profile.map((e) => ({
    name: e.station.split(" ")[0],
    elevation: e.elevation,
  }));

  const timelineData = timeline.map((t) => ({
    name: t.station.split(" ")[0],
    distance: t.distanceFromStart,
  }));

  const delayData = arrivalHistory.map((a) => ({
    name: a.station.split(" ")[0],
    delay: a.delay,
  }));

  return (
    <div className="analytics">
      {/* Stats dashboard */}
      <div className="grid grid-4 analytics-stats">
        <div className="glass-card stat-card">
          <div className="stat-label">Journey Completion</div>
          <AnimatedCounter value={completion} suffix="%" />
          <div className="progress-track stat-progress">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Total Distance</div>
          <AnimatedCounter value={distance.total} suffix=" km" />
          <small className="stat-sub">
            {distance.covered} covered • {distance.remaining} remaining
          </small>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Avg Speed</div>
          <AnimatedCounter value={distance.avgSpeed} suffix=" km/h" />
          <small className="stat-sub">Estimated cruising speed</small>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Delay Status</div>
          <div className={`delay-big ${delayStatus === "On Time" ? "on-time" : "delayed"}`}>
            {delayStatus === "On Time" ? "On Time ✓" : `+${delayMinutes} min`}
          </div>
          <small className="stat-sub">
            {delayStatus === "On Time" ? "Running as scheduled" : "Delayed at current station"}
          </small>
        </div>
      </div>

      {/* Elevation profile */}
      <div className="glass-card chart-card">
        <h3 className="chart-title">⛰️ Elevation Profile Along Route</h3>
        <div className="chart-highest">
          Highest point: <strong>{elevation.highest?.station}</strong> —{" "}
          <AnimatedCounter value={elevation.maxElevation} suffix=" m" />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={elevationData}>
            <defs>
              <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f8cff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            <Area type="monotone" dataKey="elevation" stroke="#4f8cff" fill="url(#elevGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline + Delay */}
      <div className="grid grid-2">
        <div className="glass-card chart-card">
          <h3 className="chart-title">🕐 Travel Timeline (Distance)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="distance" stroke="#6ee7b7" fill="url(#timeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card chart-card">
          <h3 className="chart-title">⏱️ Station Arrival Delays</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={delayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Bar dataKey="delay" radius={[6, 6, 0, 0]}>
                {delayData.map((d, i) => (
                  <Cell key={i} fill={d.delay > 0 ? "#ef4444" : "#22c55e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Arrival history table */}
      <div className="glass-card">
        <h3 className="chart-title">📋 Station Arrival History</h3>
        <div className="arrival-table">
          {arrivalHistory.map((a, i) => (
            <div className="arrival-row" key={i}>
              <span className="arrival-station">{a.station}</span>
              <span className="arrival-code">{a.code}</span>
              <span className="arrival-time">{a.arrivalTime}</span>
              <span className={`badge ${a.status === "On Time" ? "badge-on-time" : "badge-delayed"}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
