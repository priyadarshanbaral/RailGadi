import { Router } from "express";
import { trains } from "../data/trainIndex.js";
import { stationByCode } from "../data/stationData.js";
import { geoFeatures, travelGuides, companionData } from "../data/routes.js";

const router = Router();

// GET /api/companion/:number - full smart travel companion data
router.get("/:number", (req, res) => {
  const train = trains.find((t) => t.number === req.params.number);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const current = routeStations[0];
  const destination = routeStations[routeStations.length - 1];
  const next = routeStations[1] || current;

  const hash = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const progress = Math.min(0.95, 0.15 + (hash % 70) / 100);
  const currentIdx = Math.floor(progress * (routeStations.length - 1));
  const currentStation = routeStations[currentIdx];
  const nextStation = routeStations[currentIdx + 1] || currentStation;
  const destStation = routeStations[routeStations.length - 1];

  const weather = (code) => companionData.weather[code] || { temp: 27, humidity: 60, wind: 10, condition: "Clear", rain: 5 };

  // Nearby geo features
  const nearby = (code) => {
    const near = (arr, type) =>
      arr
        .filter((f) => f.near.includes(code))
        .map((f) => ({ ...f, type }));
    return [
      ...near(geoFeatures.rivers, "River"),
      ...near(geoFeatures.lakes, "Lake"),
      ...near(geoFeatures.mountains, "Mountain"),
    ];
  };

  const guide = travelGuides[currentStation?.code] || travelGuides.NDLS;

  res.json({
    train: { number: train.number, name: train.name, from: train.from, to: train.to },
    weather: {
      current: { station: currentStation?.name, ...weather(currentStation?.code) },
      next: { station: nextStation?.name, ...weather(nextStation?.code) },
      destination: { station: destStation?.name, ...weather(destStation?.code) },
    },
    geoFeatures: nearby(currentStation?.code),
    travelGuide: guide,
    safety: companionData.safety,
    emergency: companionData.emergency,
    currentStation: currentStation?.name,
    nextStation: nextStation?.name,
  });
});

export default router;
