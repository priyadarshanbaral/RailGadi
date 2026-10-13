import { Router } from "express";
import { trains } from "../data/trainIndex.js";
import { stationByCode } from "../data/stationData.js";
import { companionData } from "../data/routes.js";

const router = Router();

const weatherFor = (code) =>
  companionData.weather[code] || {
    temp: 27,
    humidity: 60,
    wind: 10,
    condition: "Clear",
    rain: 5,
  };

// GET /api/weather/current?station=CODE — current weather at a station
router.get("/current", (req, res) => {
  const { station } = req.query;
  if (!station) return res.status(400).json({ error: "Query parameter 'station' is required" });

  const s = stationByCode(String(station).toUpperCase());
  if (!s) return res.status(404).json({ error: "Station not found" });

  const w = weatherFor(s.code);
  res.json({
    station: { code: s.code, name: s.name, state: s.state, lat: s.lat, lng: s.lng },
    current: {
      ...w,
      feelsLike: w.temp - 2,
      pressure: 1012,
      visibility: 8,
      updatedAt: new Date().toISOString(),
    },
  });
});

// GET /api/weather/forecast?station=CODE — 5-day forecast for a station
router.get("/forecast", (req, res) => {
  const { station } = req.query;
  if (!station) return res.status(400).json({ error: "Query parameter 'station' is required" });

  const s = stationByCode(String(station).toUpperCase());
  if (!s) return res.status(404).json({ error: "Station not found" });

  const w = weatherFor(s.code);
  const conditions = ["Clear", "Partly Cloudy", "Cloudy", "Humid", "Rainy", "Sunny"];
  const startIdx = Math.max(0, conditions.indexOf(w.condition));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const forecast = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(Date.now() + (i + 1) * 86400000);
    return {
      date: date.toISOString().split("T")[0],
      day: days[date.getDay()],
      tempMax: Math.min(42, w.temp + 2 + i),
      tempMin: Math.max(10, w.temp - 6 + i),
      humidity: Math.min(95, w.humidity + i * 3),
      condition: conditions[(startIdx + i) % conditions.length],
      rain: Math.min(90, w.rain + i * 8),
    };
  });

  res.json({
    station: { code: s.code, name: s.name, state: s.state },
    forecast,
  });
});

// GET /api/weather/route-weather?trainNumber=NUM — weather for every station on a route
router.get("/route-weather", (req, res) => {
  const { trainNumber } = req.query;
  if (!trainNumber) {
    return res.status(400).json({ error: "Query parameter 'trainNumber' is required" });
  }

  const train = trains.find((t) => t.number === trainNumber);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const stations = train.route.map((code, i) => {
    const s = stationByCode(code);
    return {
      seq: i + 1,
      station: s?.name || code,
      code,
      state: s?.state,
      ...weatherFor(code),
    };
  });

  res.json({
    train: { number: train.number, name: train.name, from: train.from, to: train.to },
    stations,
  });
});

export default router;

