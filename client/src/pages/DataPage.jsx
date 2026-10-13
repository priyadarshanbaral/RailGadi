import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client.js";
import TrainCard from "../components/TrainCard.jsx";
import { SkeletonGrid } from "../components/Skeleton.jsx";

export default function DataPage() {
  const [activeTab, setActiveTab] = useState("stations");

  // Stations state
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationQuery, setStationQuery] = useState("");
  const [shownStations, setShownStations] = useState(200);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationDetail, setStationDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Trains state
  const [trains, setTrains] = useState([]);
  const [trainsLoading, setTrainsLoading] = useState(true);
  const [trainQuery, setTrainQuery] = useState("");
  const [shownTrains, setShownTrains] = useState(60);
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    api
      .getStations()
      .then((data) => setStations(data.stations || []))
      .catch(() => setStations([]))
      .finally(() => setStationsLoading(false));
  }, []);

  useEffect(() => {
    api
      .getAllTrains()
      .then((data) => {
        const seen = new Set();
        const unique = (data || []).filter((t) => {
          if (seen.has(t.number)) return false;
          seen.add(t.number);
          return true;
        });
        setTrains(unique);
      })
      .catch(() => setTrains([]))
      .finally(() => setTrainsLoading(false));
  }, []);

  const filteredStations = useMemo(() => {
    const q = stationQuery.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q)
    );
  }, [stations, stationQuery]);

  const filteredTrains = useMemo(() => {
    const q = trainQuery.trim().toLowerCase();
    if (!q) return trains;
    return trains.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.number.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.fromCode || "").toLowerCase().includes(q) ||
        (t.toCode || "").toLowerCase().includes(q)
    );
  }, [trains, trainQuery]);

  useEffect(() => setShownStations(200), [stationQuery]);
  useEffect(() => setShownTrains(60), [trainQuery]);

  const openStationDetail = async (station) => {
    setSelectedStation(station);
    setDetailLoading(true);
    setStationDetail(null);
    try {
      const data = await api.getStation(station.code);
      setStationDetail(data);
    } catch {
      setStationDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleRoute = async (train) => {
    if (expandedRoute === train.number) {
      setExpandedRoute(null);
      setRouteData(null);
      return;
    }
    setExpandedRoute(train.number);
    setRouteLoading(true);
    setRouteData(null);
    try {
      const data = await api.train.route(train.number);
      setRouteData(data);
    } catch {
      setRouteData(null);
    } finally {
      setRouteLoading(false);
    }
  };

  const tabs = [
    { id: "stations", label: `🚉 Stations (${stations.length})` },
    { id: "trains", label: `🚆 Trains (${trains.length})` },
  ];

  return (
    <div className="data-page">
      <motion.div
        className="glass-card data-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="data-title">📊 Explore Data</h1>
        <p className="data-sub">
          Browse all Indian Railway stations and trains served by the RailGaadi API — searchable,
          formatted and ready to explore.
        </p>
      </motion.div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content fade-in-up">
        {activeTab === "stations" && (
          <section>
            <div className="glass-card data-toolbar">
              <input
                className="data-search"
                placeholder="Search by code, name or state..."
                value={stationQuery}
                onChange={(e) => setStationQuery(e.target.value)}
              />
              <span className="data-count">{filteredStations.length} stations</span>
            </div>

            {stationsLoading ? (
              <SkeletonGrid count={6} />
            ) : filteredStations.length === 0 ? (
              <div className="route-empty glass-card">No stations match your search.</div>
            ) : (
              <div className="glass-card data-table-card">
                <div className="data-table">
                  <div className="data-table-row data-table-head">
                    <span>Code</span>
                    <span>Station</span>
                    <span>State</span>
                    <span>Platform</span>
                    <span>Elevation</span>
                    <span>Lat / Lng</span>
                  </div>
                  {filteredStations.slice(0, shownStations).map((s, index) => (
                    <button
                      key={`${s.code}-${index}`}
                      className="data-table-row data-table-body"
                      onClick={() => openStationDetail(s)}
                    >
                      <span className="data-code">{s.code}</span>
                      <span className="data-name">{s.name}</span>
                      <span className="data-muted">{s.state}</span>
                      <span className="data-platform">🛤️ {s.platform}</span>
                      <span className="data-muted">{s.elev} m</span>
                      <span className="data-gps">{s.lat}, {s.lng}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!stationsLoading && shownStations < filteredStations.length && (
              <div className="train-see-all">
                <button
                  className="btn btn-primary"
                  onClick={() => setShownStations((shown) => Math.min(shown + 200, filteredStations.length))}
                >
                  Load More Stations ({filteredStations.length - shownStations} remaining)
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === "trains" && (
          <section>
            <div className="glass-card data-toolbar">
              <input
                className="data-search"
                placeholder="Search by number, name, type or route code..."
                value={trainQuery}
                onChange={(e) => setTrainQuery(e.target.value)}
              />
              <span className="data-count">{filteredTrains.length} trains</span>
            </div>

            {trainsLoading ? (
              <SkeletonGrid count={6} />
            ) : filteredTrains.length === 0 ? (
              <div className="route-empty glass-card">No trains match your search.</div>
            ) : (
              <div className="grid grid-3">
                {filteredTrains.slice(0, shownTrains).map((t) => (
                  <div key={t.number} className="data-train-block">
                    <TrainCard train={t} />
                    <button
                      className="btn data-route-btn"
                      onClick={() => toggleRoute(t)}
                    >
                      {expandedRoute === t.number ? "▼ Hide Route" : "▶ View Route"}
                    </button>
                    {expandedRoute === t.number && (
                      <div className="glass-card data-route">
                        {routeLoading ? (
                          <div className="skeleton" style={{ height: 40 }} />
                        ) : routeData ? (
                          <>
                            <div className="data-route-head">
                              <strong>{routeData.train.name}</strong>
                              <span className="data-muted">{routeData.totalDistance} km</span>
                            </div>
                            <div className="data-route-list">
                              {routeData.stations.map((st, i) => (
                                <div className="data-route-station" key={i}>
                                  <span className="data-route-seq">{st.seq}</span>
                                  <span className="data-route-name">{st.name}</span>
                                  <span className="data-code">{st.code}</span>
                                  <span className="data-muted">{st.distanceFromStart} km</span>
                                </div>
                              ))}
                            </div>
                            {routeData.timetable?.length > 0 && (
                              <div className="data-route-list">
                                {routeData.timetable.map((stop, i) => (
                                  <div className="data-route-station" key={`${stop.seq}-${i}`}>
                                    <span className="data-route-seq">{stop.seq}</span>
                                    <span className="data-route-name">{stop.station}</span>
                                    <span className="data-muted">
                                      Arr: {stop.arrival || "—"} · Dep: {stop.departure || "—"}
                                    </span>
                                    <span className="data-muted">
                                      {stop.distance || "—"} · Day {stop.day || "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {routeData.runningDays && (
                              <div className="data-hint">
                                Runs: {Object.entries(routeData.runningDays)
                                  .filter(([, runs]) => runs)
                                  .map(([day]) => day)
                                  .join(", ") || "No running days listed"}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="data-hint">Could not load route data.</div>
                        )}
                      </div>
                    )}
                    {!trainsLoading && shownTrains < filteredTrains.length && (
                      <div className="train-see-all">
                        <button
                          className="btn btn-primary"
                          onClick={() => setShownTrains((shown) => Math.min(shown + 60, filteredTrains.length))}
                        >
                          Load More Trains ({filteredTrains.length - shownTrains} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Station detail modal */}
      {selectedStation && (
        <div className="modal-overlay" onClick={() => setSelectedStation(null)}>
          <div className="modal data-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedStation(null)}>✕</button>
            <div className="modal-brand">
              <span className="data-modal-code">{selectedStation.code}</span>
              <h2>{selectedStation.name}</h2>
              <p>{selectedStation.state}</p>
            </div>
            {detailLoading ? (
              <div className="skeleton" style={{ height: 120 }} />
            ) : stationDetail ? (
              <div className="data-detail-grid">
                <div className="data-detail-item">
                  <span>Platform</span>
                  <strong>🛤️ {stationDetail.platform}</strong>
                </div>
                <div className="data-detail-item">
                  <span>Elevation</span>
                  <strong>{stationDetail.elev} m</strong>
                </div>
                <div className="data-detail-item">
                  <span>Latitude</span>
                  <strong>{stationDetail.lat}</strong>
                </div>
                <div className="data-detail-item">
                  <span>Longitude</span>
                  <strong>{stationDetail.lng}</strong>
                </div>
              </div>
            ) : (
              <div className="data-hint">Could not load station details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
