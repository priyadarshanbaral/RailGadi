import { Router } from "express";
import { trains } from "../data/trainIndex.js";
import { stationByCode } from "../data/stationData.js";
import { buildRoutePolyline } from "../data/routes.js";
import {
  routeDistance,
  elevationProfile,
  distanceToIndex,
} from "../utils/geo.js";

const router = Router();

// GET /api/analytics/:number - full journey analytics dashboard
router.get("/:number", (req, res) => {
  const train = trains.find((t) => t.number === req.params.number);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const polyline = buildRoutePolyline(train.route);
  const totalDistance = routeDistance(polyline);

  const hash = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const progress = Math.min(0.95, 0.15 + (hash % 70) / 100);

  // Elevation profile
  const stationMap = Object.fromEntries(routeStations.map((s) => [s.code, s]));
  const elevation = elevationProfile(train.route, stationMap);
  const highestElevation = elevation.reduce((m, e) => (e.elevation > m.elevation ? e : m), elevation[0]);

  // Distance analytics
  const distanceCovered = Math.round(distanceToIndex(polyline, Math.floor(progress * (train.route.length - 1)) + 1));
  const distanceRemaining = Math.round(totalDistance - distanceCovered);

  // Station arrival history (simulated)
  const arrivalHistory = train.route.slice(0, Math.floor(progress * train.route.length) + 1).map((code, i) => {
    const s = stationByCode(code);
    const delayAt = i % 3 === 0 ? train.delay : 0;
    return {
      station: s?.name || code,
      code,
      arrivalTime: `${String(6 + i).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      delay: delayAt,
      status: delayAt > 0 ? "Delayed" : "On Time",
    };
  });

  // Timeline
  const timeline = routeStations.map((s, i) => ({
    index: i,
    station: s.name,
    time: `${String(6 + i).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    distanceFromStart: Math.round(distanceToIndex(polyline, i + 1)),
  }));

  res.json({
    train: { number: train.number, name: train.name, type: train.type, status: train.status, delay: train.delay },
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
    arrivalHistory,
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
