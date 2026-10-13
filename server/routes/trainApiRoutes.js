import { Router } from "express";
import { trains, findTrain } from "../data/trainIndex.js";
import { stationByCode } from "../data/stationData.js";
import { buildRoutePolyline } from "../data/routes.js";
import {
  routeDistance,
  distanceToIndex,
  interpolatePoint,
  currentStationIndex,
  elevationProfile,
} from "../utils/geo.js";

const router = Router();

// Deterministic simulated live progress for a train (0.15 - 0.95)
const liveProgress = (train) => {
  const hash = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.min(0.95, 0.15 + (hash % 70) / 100);
};

// GET /api/train/search?q=... — search train by number/name/type
router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

  const results = findTrain(q).map((t) => ({
    number: t.number,
    name: t.name,
    from: stationByCode(t.from)?.name || t.from,
    to: stationByCode(t.to)?.name || t.to,
    fromCode: t.from,
    toCode: t.to,
    type: t.type,
    status: t.status,
    delay: t.delay,
  }));
  res.json(results);
});

// GET /api/train/live/:trainNumber — live train location & running status
router.get("/live/:trainNumber", (req, res) => {
  const train = trains.find((t) => t.number === req.params.trainNumber);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const polyline = buildRoutePolyline(train.route);
  const totalDistance = routeDistance(polyline);

  const progress = liveProgress(train);
  const currentIdx = currentStationIndex(train.route, progress);
  const currentStation = routeStations[currentIdx];
  const nextStation = routeStations[currentIdx + 1] || null;
  const livePos = interpolatePoint(polyline, progress);
  const distanceCovered = distanceToIndex(polyline, currentIdx + 1);
  const distanceRemaining = totalDistance - distanceCovered;

  const upcoming = routeStations.slice(currentIdx + 1).map((s, i) => ({
    code: s.code,
    name: s.name,
    state: s.state,
    etaMinutes: 45 + i * 60,
    distanceRemaining: Math.round(
      distanceToIndex(polyline, currentIdx + 1 + i + 1) - distanceCovered
    ),
  }));

  res.json({
    train: {
      number: train.number,
      name: train.name,
      type: train.type,
      status: train.status,
      delay: train.delay,
      from: train.from,
      to: train.to,
    },
    currentStation,
    nextStation,
    livePosition: { lat: livePos[0], lng: livePos[1] },
    progress: Math.round(progress * 100),
    distanceCovered: Math.round(distanceCovered),
    distanceRemaining: Math.round(distanceRemaining),
    totalDistance: Math.round(totalDistance),
    lastUpdate: new Date().toISOString(),
    upcoming,
  });
});

// GET /api/train/route/:trainNumber — complete railway route with polyline & stations
router.get("/route/:trainNumber", (req, res) => {
  const train = trains.find((t) => t.number === req.params.trainNumber);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const polyline = buildRoutePolyline(train.route);
  const totalDistance = routeDistance(polyline);

  const stations = routeStations.map((s, i) => ({
    code: s.code,
    name: s.name,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    elevation: s.elev,
    seq: i + 1,
    distanceFromStart: Math.round(distanceToIndex(polyline, i + 1)),
  }));

  res.json({
    train: { number: train.number, name: train.name, from: train.from, to: train.to },
    totalDistance: Math.round(totalDistance),
    stations,
    polyline,
  });
});

// GET /api/train/stations/:trainNumber — station arrival history
router.get("/stations/:trainNumber", (req, res) => {
  const train = trains.find((t) => t.number === req.params.trainNumber);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const progress = liveProgress(train);
  const visitedCount = Math.floor(progress * train.route.length) + 1;

  const history = train.route.slice(0, visitedCount).map((code, i) => {
    const s = stationByCode(code);
    const delayAt = i % 3 === 0 ? train.delay : 0;
    return {
      station: s?.name || code,
      code,
      seq: i + 1,
      arrivalTime: `${String(6 + i).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      delay: delayAt,
      status: delayAt > 0 ? "Delayed" : "On Time",
    };
  });

  res.json({
    train: { number: train.number, name: train.name },
    visitedCount,
    totalStations: train.route.length,
    history,
  });
});

// GET /api/train/analytics/:trainNumber — journey analytics dashboard
router.get("/analytics/:trainNumber", (req, res) => {
  const train = trains.find((t) => t.number === req.params.trainNumber);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const polyline = buildRoutePolyline(train.route);
  const totalDistance = routeDistance(polyline);

  const progress = liveProgress(train);
  const stationMap = Object.fromEntries(routeStations.map((s) => [s.code, s]));
  const elevation = elevationProfile(train.route, stationMap);
  const highestElevation = elevation.reduce((m, e) =>
    e.elevation > m.elevation ? e : m, elevation[0]);

  const distanceCovered = Math.round(
    distanceToIndex(polyline, Math.floor(progress * (train.route.length - 1)) + 1)
  );
  const distanceRemaining = Math.round(totalDistance - distanceCovered);

  const timeline = routeStations.map((s, i) => ({
    index: i,
    station: s.name,
    time: `${String(6 + i).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    distanceFromStart: Math.round(distanceToIndex(polyline, i + 1)),
  }));

  res.json({
    train: {
      number: train.number,
      name: train.name,
      type: train.type,
      status: train.status,
      delay: train.delay,
    },
    completion: Math.round(progress * 100),
    delayMinutes: train.delay,
    delayStatus: train.delay > 0 ? "Delayed" : "On Time",
    distance: {
      total: totalDistance,
      covered: distanceCovered,
      remaining: distanceRemaining,
      percentage: Math.round((distanceCovered / totalDistance) * 100),
      avgSpeed: Math.round(totalDistance / 18),
    },
    elevation: {
      profile: elevation,
      highest: highestElevation,
      maxElevation: highestElevation?.elevation || 0,
      minElevation: Math.min(...elevation.map((e) => e.elevation)),
    },
    timeline,
    lastUpdated: new Date().toISOString(),
  });
});

export default router;

