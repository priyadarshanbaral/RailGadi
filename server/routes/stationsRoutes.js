  import { Router } from "express";
import { stations, stationByCode, platformFor } from "../data/stationData.js";
import { trains } from "../data/trainIndex.js";
import { buildRoutePolyline } from "../data/routes.js";
import { routeDistance, interpolatePoint, currentStationIndex } from "../utils/geo.js";

const router = Router();

// Deterministic simulated live progress for a train (0.15 - 0.95)
const liveProgress = (train) => {
  const hash = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.min(0.95, 0.15 + (hash % 70) / 100);
};

// Build the live summary for a train that passes through a station
const trainSummary = (train, viaCode) => {
  const fromStation = stationByCode(train.from);
  const toStation = stationByCode(train.to);
  const viaIdx = train.route.indexOf(viaCode);
  const polyline = buildRoutePolyline(train.route);
  const distance = Math.round(routeDistance(polyline));
  const progress = liveProgress(train);
  const currentIdx = currentStationIndex(train.route, progress);
  const livePos = interpolatePoint(polyline, progress);
  return {
    number: train.number,
    name: train.name,
    type: train.type,
    status: train.status,
    delay: train.delay,
    from: fromStation?.name || train.from,
    fromCode: train.from,
    to: toStation?.name || train.to,
    toCode: train.to,
    stops: viaIdx,
    totalDistance: distance,
    livePosition: livePos
      ? { lat: Number(livePos[0].toFixed(4)), lng: Number(livePos[1].toFixed(4)) }
      : null,
    progress: Math.round(progress * 100),
  };
};

// GET /api/stations/search?q=... — search all stations by code/name/state
router.get("/search", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const list = stations
    .filter(
      (s) =>
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q)
    )
    .slice(0, 50)
    .map((s) => ({
      code: s.code,
      name: s.name,
      state: s.state,
      lat: s.lat,
      lng: s.lng,
      platform: platformFor(s.code),
    }));
  res.json({ count: list.length, stations: list });
});

// GET /api/stations - list all stations with platform info
router.get("/", (req, res) => {
  const list = stations.map((s) => ({
    code: s.code,
    name: s.name,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    platform: platformFor(s.code),
  }));
  res.json({ count: list.length, stations: list });
});

// GET /api/stations/:code/trains — all trains that pass through this station
router.get("/:code/trains", (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const station = stationByCode(code);
  if (!station) return res.status(404).json({ error: `Station '${code}' not found` });

  const matches = trains
    .filter((t) => t.route.includes(code))
    .map((t) => trainSummary(t, code))
    .sort((a, b) => a.stops - b.stops);

  res.json({
    station,
    count: matches.length,
    trains: matches,
  });
});

// GET /api/stations/:code - single station detail
router.get("/:code", (req, res) => {
  const s = stations.find(
    (st) => st.code === String(req.params.code).toUpperCase()
  );
  if (!s) return res.status(404).json({ error: "Station not found" });
  res.json({
    code: s.code,
    name: s.name,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    elev: s.elev,
    platform: platformFor(s.code),
  });
});

export default router;
