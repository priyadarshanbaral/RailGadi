import { Router } from "express";
import { trains } from "../data/trainIndex.js";
import { stationByCode } from "../data/stationData.js";
import { buildRoutePolyline } from "../data/routes.js";
import { routeDistance, interpolatePoint, currentStationIndex } from "../utils/geo.js";

const router = Router();

// GET /api/map/:number - immersive journey map data
router.get("/:number", (req, res) => {
  const train = trains.find((t) => t.number === req.params.number);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const polyline = buildRoutePolyline(train.route);
  const totalDistance = routeDistance(polyline);

  const hash = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const progress = Math.min(0.95, 0.15 + (hash % 70) / 100);
  const currentIdx = currentStationIndex(train.route, progress);
  const livePos = interpolatePoint(polyline, progress);

  // Completed / remaining route split
  const completedPolyline = polyline.slice(0, currentIdx + 1);
  const remainingPolyline = polyline.slice(currentIdx);

  res.json({
    train: {
      number: train.number,
      name: train.name,
      type: train.type,
      status: train.status,
      delay: train.delay,
    },
    polyline,
    completedPolyline,
    remainingPolyline,
    livePosition: { lat: livePos[0], lng: livePos[1] },
    currentStation: routeStations[currentIdx],
    stations: routeStations,
    progress: Math.round(progress * 100),
    totalDistance: Math.round(totalDistance),
    distanceCovered: Math.round(totalDistance * progress),
    distanceRemaining: Math.round(totalDistance * (1 - progress)),
  });
});

export default router;
