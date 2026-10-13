import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom train marker
const trainIcon = L.divIcon({
  className: "train-marker",
  html: `<div class="train-marker-inner">🚂</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Camera follow component
function CameraFollow({ position, follow }) {
  const map = useMap();
  useEffect(() => {
    if (follow && position) {
      map.flyTo(position, 6, { duration: 1.2 });
    }
  }, [position, follow, map]);
  return null;
}

export default function LiveMap({ mapData }) {
  const [follow, setFollow] = useState(true);
  const [center, setCenter] = useState([20.5, 78.5]);

  useEffect(() => {
    if (mapData?.livePosition) {
      setCenter([mapData.livePosition.lat, mapData.livePosition.lng]);
    }
  }, [mapData]);

  if (!mapData) return null;

  const { polyline, completedPolyline, remainingPolyline, livePosition, stations, currentStation } = mapData;

  return (
    <div className="livemap">
      <div className="livemap-toolbar">
        <button
          className={`btn ${follow ? "btn-primary" : ""}`}
          onClick={() => setFollow((f) => !f)}
        >
          {follow ? "🎥 Following Train" : "🎥 Follow Train"}
        </button>
        <span className="livemap-hint">Drag to explore • Scroll to zoom</span>
      </div>
      <MapContainer center={center} zoom={5} className="livemap-container" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <CameraFollow position={center} follow={follow} />

        {/* Full route */}
        <Polyline positions={polyline} pathOptions={{ color: "#64748b", weight: 3, opacity: 0.4 }} />

        {/* Completed route with glow */}
        <Polyline
          positions={completedPolyline}
          pathOptions={{ color: "#4f8cff", weight: 5, opacity: 0.9 }}
        />
        {/* Remaining route dashed */}
        <Polyline
          positions={remainingPolyline}
          pathOptions={{ color: "#6ee7b7", weight: 3, opacity: 0.6, dashArray: "8 8" }}
        />

{/* Station markers */}
        {stations.map((s) => {
          const isCurrent = currentStation?.code === s.code;
          return (
            <CircleMarker
              key={s.code}
              center={[s.lat, s.lng]}
              radius={isCurrent ? 8 : 5}
              pathOptions={{
                color: isCurrent ? "#f59e0b" : "#4f8cff",
                fillColor: isCurrent ? "#f59e0b" : "#4f8cff",
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <strong>{s.name}</strong> ({s.code})
                {isCurrent && <div>📍 Current Station</div>}
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Live train marker */}
        {livePosition && (
          <Marker position={[livePosition.lat, livePosition.lng]} icon={trainIcon}>
            <Popup>
              <strong>🚂 Live Train</strong>
              <br />
              {currentStation?.name}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
