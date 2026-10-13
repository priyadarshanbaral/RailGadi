import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { api } from "../api/client.js";
import AnimatedCounter from "../components/AnimatedCounter.jsx";

const trainIcon = L.divIcon({
  className: "train-marker",
  html: `<div class="train-marker-inner">🚂</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

function CameraFollow({ position, follow }) {
  const map = useMap();
  useEffect(() => {
    if (follow && position) {
      map.flyTo(position, 6, { duration: 1.5 });
    }
  }, [position, follow, map]);
  return null;
}

export default function RouteMap() {
  const { number } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [follow, setFollow] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getMapData(number)
      .then((result) => {
        if (!result || !result.polyline) {
          setError("Journey map data not available for this train");
        } else {
          setData(result);
        }
      })
      .catch((err) => setError(err.message || "Failed to load journey map"))
      .finally(() => setLoading(false));
  }, [number]);

  if (loading) {
    return (
      <div className="fullscreen-map-loading">
        <div className="load-spinner">🚂</div>
        <p>Loading immersive journey map...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="map-error-container">
        <div className="error-state glass-card">
          <h2>🗺️ Journey Map</h2>
          <p className="error-message">{error || "No map data available"}</p>
          <p className="error-hint">Please make sure the train number is valid and try again.</p>
          <Link to="/" className="btn btn-primary">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const { polyline, completedPolyline, remainingPolyline, livePosition, stations, currentStation, progress, totalDistance, distanceCovered, distanceRemaining, train } = data;
  const center = livePosition ? [livePosition.lat, livePosition.lng] : [20.5, 78.5];

  return (
    <div className="fullscreen-map">
      <MapContainer center={center} zoom={5} className="fullscreen-map-container" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />
        <CameraFollow position={center} follow={follow} />

        <Polyline positions={polyline} pathOptions={{ color: "#64748b", weight: 3, opacity: 0.4 }} />
        <Polyline positions={completedPolyline} pathOptions={{ color: "#4f8cff", weight: 6, opacity: 0.95 }} />
        <Polyline positions={remainingPolyline} pathOptions={{ color: "#6ee7b7", weight: 3, opacity: 0.6, dashArray: "8 8" }} />

        {stations.map((s, i) => (
          <CircleMarker
            key={s.code}
            center={[s.lat, s.lng]}
            radius={currentStation?.code === s.code ? 10 : 5}
            pathOptions={{
              color: currentStation?.code === s.code ? "#f59e0b" : "#4f8cff",
              fillColor: currentStation?.code === s.code ? "#f59e0b" : "#4f8cff",
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <strong>{s.name}</strong> ({s.code})
              {currentStation?.code === s.code && <div>📍 Current Station</div>}
            </Popup>
          </CircleMarker>
        ))}

        {livePosition && (
          <Marker position={[livePosition.lat, livePosition.lng]} icon={trainIcon}>
            <Popup>
              <strong>🚂 {train.name}</strong>
              <br />{currentStation?.name}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Overlay controls */}
      <div className="map-overlay">
        <div className="map-overlay-top">
          <Link to={`/train/${number}`} className="btn map-back">
            ← Back
          </Link>
          <button className={`btn ${follow ? "btn-primary" : ""}`} onClick={() => setFollow((f) => !f)}>
            {follow ? "🎥 Following" : "🎥 Follow"}
          </button>
        </div>

        <div className="map-overlay-bottom glass-card">
          <div className="map-overlay-header">
            <h3 className="map-overlay-title">{train.name}</h3>
            <div className="map-overlay-meta">
              <span className="train-number">#{train.number}</span>
              <span className={`train-status ${train.status?.toLowerCase() || 'unknown'}`}>
                {train.status || "Status Unknown"}
              </span>
              {train.delay && <span className="train-delay">⏱️ {train.delay}</span>}
            </div>
          </div>
          
          <div className="map-overlay-stats">
            <div>
              <span>Progress</span>
              <strong><AnimatedCounter value={progress} suffix="%" /></strong>
            </div>
            <div>
              <span>Covered</span>
              <strong><AnimatedCounter value={distanceCovered} suffix=" km" /></strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong><AnimatedCounter value={distanceRemaining} suffix=" km" /></strong>
            </div>
            <div>
              <span>Total</span>
              <strong><AnimatedCounter value={totalDistance} suffix=" km" /></strong>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="map-overlay-station">
            <span className="map-station-dot current"></span> Current Station
            <strong>{currentStation?.name || "Loading..."}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
