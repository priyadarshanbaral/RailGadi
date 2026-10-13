import { Router } from "express";
import { trains } from "../data/trainIndex.js";
import { calculateLiveTelemetry } from "../utils/liveTracker.js";

const router = Router();

// GET /api/map/:number - immersive journey map data
router.get("/:number", (req, res) => {
  const train = trains.find((t) => t.number === req.params.number);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const simSpeed = parseFloat(req.query.simSpeed) || 1;
  const customTime = req.query.time ? Number(req.query.time) : undefined;

  const tele = calculateLiveTelemetry(train, { simSpeed, customTime });

  res.json({
    train: tele.train,
    telemetry: tele.telemetry,
    polyline: tele.polyline,
    completedPolyline: tele.completedPolyline,
    remainingPolyline: tele.remainingPolyline,
    livePosition: tele.livePosition,
    currentStation: tele.currentStation,
    nextStation: tele.nextStation,
    destination: tele.destination,
    stations: tele.routeStations,
    progress: tele.progress,
    totalDistance: tele.totalDistance,
    distanceCovered: tele.distanceCovered,
    distanceRemaining: tele.distanceRemaining,
  });
});

export default router;
