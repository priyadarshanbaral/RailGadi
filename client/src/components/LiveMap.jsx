import { useEffect, useState } from "react";
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
import "leaflet/dist/leaflet.css";

// Dynamic train icon with radar pulse and speed tag
const createTrainMarker = (bearing = 0, speed = 0, status = "On Time") => {
  const isHalt = speed === 0;
  return L.divIcon({
    className: "live-train-div-icon",
    html: `
      <div class="train-radar-wrapper">
        <div class="radar-pulse-ring"></div>
        <div class="train-loco-marker ${isHalt ? "halted" : ""}">
          <span class="train-emoji">🚅</span>
        </div>
        <div class="marker-speed-tag ${isHalt ? "halt-tag" : status === "On Time" ? "speed-ontime" : "speed-delayed"}">
          ${isHalt ? "HALT" : `${speed} km/h`}
        </div>
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
};

// Fleet train icon for nationwide radar
const createFleetMarker = (t, isSelected) => {
  return L.divIcon({
    className: "fleet-radar-icon",
    html: `
      <div class="fleet-marker-badge ${isSelected ? "selected" : ""} ${t.status === "On Time" ? "on-time" : "delayed"}">
        <span class="fleet-dot"></span>
        <span class="fleet-num">${t.number}</span>
        <span class="fleet-speed">${t.speedKmH}k</span>
      </div>
    `,
    iconSize: [70, 24],
    iconAnchor: [35, 12],
  });
};

// Camera follow component
function CameraFollow({ position, follow, zoom = 7 }) {
  const map = useMap();
  useEffect(() => {
    if (follow && position && Array.isArray(position) && position[0] && position[1]) {
      map.flyTo(position, zoom, { duration: 1.4, easeLinearity: 0.25 });
    }
  }, [position, follow, zoom, map]);
  return null;
}

const MAP_LAYERS = {
  dark: {
    name: "Dark Radar",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri World Imagery",
  },
  street: {
    name: "Street Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
};

export default function LiveMap({
  mapData,
  fleet = [],
  selectedTrainNumber,
  onSelectFleetTrain,
  zoom = 7,
}) {
  const [follow, setFollow] = useState(true);
  const [mapStyle, setMapStyle] = useState("dark");
  const [center, setCenter] = useState([23.5, 78.5]);

  // Center update from single train mapData
  useEffect(() => {
    if (mapData?.livePosition?.lat && mapData?.livePosition?.lng) {
      setCenter([mapData.livePosition.lat, mapData.livePosition.lng]);
    }
  }, [mapData]);

  const livePos = mapData?.livePosition;
  const speed = mapData?.telemetry?.speedKmH ?? 110;
  const bearing = mapData?.telemetry?.bearing ?? 0;
  const status = mapData?.train?.status ?? "On Time";
  const polyline = mapData?.polyline || [];
  const completedPolyline = mapData?.completedPolyline || [];
  const remainingPolyline = mapData?.remainingPolyline || [];
  const stations = mapData?.stations || [];
  const currentStation = mapData?.currentStation;

  return (
    <div className="livemap">
      <div className="livemap-toolbar">
        <div className="livemap-controls-left">
          <button
            className={`btn btn-sm ${follow ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFollow((f) => !f)}
          >
            {follow ? "🎥 Camera: Auto-Tracking" : "🎥 Camera: Free View"}
          </button>
          <div className="map-style-pills">
            {Object.entries(MAP_LAYERS).map(([key, item]) => (
              <button
                key={key}
                className={`map-style-pill ${mapStyle === key ? "active" : ""}`}
                onClick={() => setMapStyle(key)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="livemap-telemetry-pill">
          <span className="telemetry-live-dot"></span>
          <span>{mapData?.train ? `${mapData.train.name} (${speed} km/h)` : "Radar Active"}</span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="livemap-container"
        scrollWheelZoom
      >
        <TileLayer
          attribution={MAP_LAYERS[mapStyle].attribution}
          url={MAP_LAYERS[mapStyle].url}
        />
        <CameraFollow position={center} follow={follow} zoom={zoom} />

        {/* Full route background glow */}
        {polyline.length > 0 && (
          <Polyline
            positions={polyline}
            pathOptions={{ color: "#334155", weight: 4, opacity: 0.5 }}
          />
        )}

        {/* Completed route electric blue */}
        {completedPolyline.length > 0 && (
          <Polyline
            positions={completedPolyline}
            pathOptions={{ color: "#38bdf8", weight: 5, opacity: 0.95 }}
          />
        )}

        {/* Remaining route dashed emerald */}
        {remainingPolyline.length > 0 && (
          <Polyline
            positions={remainingPolyline}
            pathOptions={{ color: "#10b981", weight: 3, opacity: 0.8, dashArray: "6 6" }}
          />
        )}

        {/* Station Markers along route */}
        {stations.map((s, idx) => {
          const isCurrent = currentStation?.code === s.code;
          return (
            <CircleMarker
              key={`${s.code}-${idx}`}
              center={[s.lat, s.lng]}
              radius={isCurrent ? 9 : 5}
              pathOptions={{
                color: isCurrent ? "#f59e0b" : "#38bdf8",
                fillColor: isCurrent ? "#f59e0b" : "#0284c7",
                fillOpacity: 0.9,
                weight: isCurrent ? 3 : 1.5,
              }}
            >
              <Popup className="station-leaflet-popup">
                <div className="station-popup-content">
                  <div className="station-popup-title">
                    <strong>{s.name}</strong> ({s.code})
                  </div>
                  <div className="station-popup-state">{s.state || "Indian Railways"}</div>
                  <div className="station-popup-platform">
                    Platform: <strong>{s.platform || 1}</strong>
                  </div>
                  {isCurrent && (
                    <div className="station-popup-badge current">📍 Current Station</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Primary Selected Train Marker */}
        {livePos?.lat && livePos?.lng && (
          <Marker
            position={[livePos.lat, livePos.lng]}
            icon={createTrainMarker(bearing, speed, status)}
          >
            <Popup className="train-leaflet-popup">
              <div className="train-popup-card">
                <div className="train-popup-header">
                  <strong>{mapData?.train?.name || "Live Train"}</strong>
                  <span className="badge badge-on-time">{speed} km/h</span>
                </div>
                <div className="train-popup-body">
                  <div><strong>Number:</strong> {mapData?.train?.number}</div>
                  <div><strong>Status:</strong> {mapData?.train?.status} {mapData?.train?.delay > 0 ? `(+${mapData.train.delay}m)` : ""}</div>
                  <div><strong>Near:</strong> {currentStation?.name || "In Transit"}</div>
                  <div><strong>GPS:</strong> {livePos.lat}, {livePos.lng}</div>
                  <div><strong>Loco:</strong> {mapData?.telemetry?.locomotive || "WAP-7"}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Fleet Markers when in Nationwide Radar mode */}
        {fleet.map((t) => {
          if (!t.livePosition?.lat || !t.livePosition?.lng) return null;
          // Avoid duplicating the currently focused train if it's already shown
          if (mapData?.train?.number === t.number) return null;
          const isSelected = selectedTrainNumber === t.number;
          return (
            <Marker
              key={t.number}
              position={[t.livePosition.lat, t.livePosition.lng]}
              icon={createFleetMarker(t, isSelected)}
              eventHandlers={{
                click: () => onSelectFleetTrain && onSelectFleetTrain(t.number),
              }}
            >
              <Popup className="fleet-leaflet-popup">
                <div className="fleet-popup-card">
                  <strong>{t.name}</strong> ({t.number})
                  <div className="fleet-popup-sub">
                    {t.from} → {t.to}
                  </div>
                  <div className="fleet-popup-meta">
                    Speed: <strong>{t.speedKmH} km/h</strong> | {t.status}
                  </div>
                  {onSelectFleetTrain && (
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={() => onSelectFleetTrain(t.number)}
                    >
                      🎯 Lock Track This Train
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
