import { Router } from "express";
import { trains, findTrain } from "../data/trainIndex.js";
import { stationByCode, platformFor } from "../data/stationData.js";
import { buildRoutePolyline } from "../data/routes.js";
import {
  routeDistance,
  distanceToIndex,
  interpolatePoint,
  currentStationIndex,
} from "../utils/geo.js";

const router = Router();

// Deterministic simulated live progress for a train (0.15 - 0.95)
const liveProgress = (train) => {
  const hash = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.min(0.95, 0.15 + (hash % 70) / 100);
};

// Build full train detail summary (used by /all and list endpoints)
const trainSummary = (t) => {
  const fromStation = stationByCode(t.from);
  const toStation = stationByCode(t.to);
  const polyline = buildRoutePolyline(t.route);
  const progress = liveProgress(t);
  const currentIdx = currentStationIndex(t.route, progress);
  const currentStation = stationByCode(t.route[currentIdx]);
  const livePos = interpolatePoint(polyline, progress);
  return {
    number: t.number,
    name: t.name,
    type: t.type,
    status: t.status,
    delay: t.delay,
    from: fromStation?.name || t.from,
    to: toStation?.name || t.to,
    fromCode: t.from,
    toCode: t.to,
    destination: {
      code: toStation?.code || t.to,
      name: toStation?.name || t.to,
      state: toStation?.state || "",
      platform: platformFor(toStation?.code || t.to),
    },
    currentStation: currentStation
      ? {
          code: currentStation.code,
          name: currentStation.name,
          state: currentStation.state,
          platform: platformFor(currentStation.code),
        }
      : null,
    livePosition: livePos
      ? { lat: Number(livePos[0].toFixed(4)), lng: Number(livePos[1].toFixed(4)) }
      : null,
    progress: Math.round(progress * 100),
    route: t.route,
    journeyStations: t.route.length,
  };
};

// GET /api/trains/search-route?from=CODE&to=CODE - find trains between two stations
router.get("/search-route", (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res
      .status(400)
      .json({ error: "Both 'from' and 'to' station codes are required" });
  }

  const fromCode = String(from).trim().toUpperCase();
  const toCode = String(to).trim().toUpperCase();

  const fromStation = stationByCode(fromCode);
  const toStation = stationByCode(toCode);
  if (!fromStation) {
    return res.status(404).json({ error: `Station '${from}' not found` });
  }
  if (!toStation) {
    return res.status(404).json({ error: `Station '${to}' not found` });
  }

  // Find trains whose route includes both stations, with FROM before TO
  const matches = trains
    .map((t) => {
      const fromIdx = t.route.indexOf(fromCode);
      const toIdx = t.route.indexOf(toCode);
      if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return null;
      return {
        number: t.number,
        name: t.name,
        from: stationByCode(t.from)?.name || t.from,
        to: stationByCode(t.to)?.name || t.to,
        fromCode: t.from,
        toCode: t.to,
        type: t.type,
        status: t.status,
        delay: t.delay,
        journeyStations: t.route.length,
        stops: toIdx - fromIdx, // number of intermediate stops
        source: fromStation.name,
        sourceCode: fromCode,
        destination: toStation.name,
        destinationCode: toCode,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.stops - b.stops);

  res.json({
    from: fromStation,
    to: toStation,
    count: matches.length,
    trains: matches,
  });
});

// GET /api/trains/station/:code - a station's details + all trains that stop at it
router.get("/station/:code", (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const station = stationByCode(code);
  if (!station) {
    return res.status(404).json({ error: `Station '${req.params.code}' not found` });
  }

  // All trains whose route includes this station, with arrival/source info
  const stationTrains = trains
    .map((t) => {
      const idx = t.route.indexOf(code);
      if (idx === -1) return null;
      const fromStation = stationByCode(t.from);
      const toStation = stationByCode(t.to);
      return {
        number: t.number,
        name: t.name,
        type: t.type,
        status: t.status,
        delay: t.delay,
        from: fromStation?.name || t.from,
        to: toStation?.name || t.to,
        fromCode: t.from,
        toCode: t.to,
        route: t.route,
        runningDays: t.runningDays,
        journeyStations: t.route.length,
        stopIndex: idx,
        isSource: idx === 0,
        isDestination: idx === t.route.length - 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isSource !== b.isSource) return a.isSource ? -1 : 1;
      return a.number.localeCompare(b.number);
    });

  res.json({
    station: {
      code: station.code,
      name: station.name,
      state: station.state,
      lat: station.lat,
      lng: station.lng,
      elev: station.elev,
      platform: platformFor(station.code),
    },
    count: stationTrains.length,
    trains: stationTrains,
  });
});

// GET /api/trains/by-station/:code - list all trains passing through a station
router.get("/by-station/:code", (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: "Station code is required" });
  }

  const station = stationByCode(code);
  if (!station) {
    return res.status(404).json({ error: `Station '${code}' not found` });
  }

  // Trains whose route includes this station (as source, destination, or intermediate)
  const matches = trains
    .filter((t) => t.route.includes(code))
    .map((t) => {
      const idx = t.route.indexOf(code);
      const fromStation = stationByCode(t.from);
      const toStation = stationByCode(t.to);
      return {
        number: t.number,
        name: t.name,
        type: t.type,
        status: t.status,
        delay: t.delay,
        from: fromStation?.name || t.from,
        to: toStation?.name || t.to,
        fromCode: t.from,
        toCode: t.to,
        role: idx === 0 ? "Source" : idx === t.route.length - 1 ? "Destination" : "Intermediate",
        stops: idx,
      };
    })
    .sort((a, b) => a.number.localeCompare(b.number));

  res.json({
    station,
    count: matches.length,
    trains: matches,
  });
});

// GET /api/trains/all - list all trains with full details
router.get("/all", (req, res) => {
  res.json(trains.map(trainSummary));
});

// GET /api/trains/search?q=... - search by number or name
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

// GET /api/trains/:number - full live tracking detail
router.get("/:number", (req, res) => {
  const train = trains.find((t) => t.number === req.params.number);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const polyline = buildRoutePolyline(train.route);
  const totalDistance = routeDistance(polyline);

  // Simulate live progress based on train number hash for dynamic feel
  const hash = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseProgress = 0.15 + (hash % 70) / 100;
  const liveProgress = Math.min(0.95, baseProgress);

  const currentIdx = currentStationIndex(train.route, liveProgress);
  const currentStation = routeStations[currentIdx];
  const nextStation = routeStations[currentIdx + 1] || null;
  const distanceCovered = distanceToIndex(polyline, currentIdx + 1);
  const distanceRemaining = totalDistance - distanceCovered;
  const livePos = interpolatePoint(polyline, liveProgress);

  const upcoming = routeStations.slice(currentIdx + 1).map((s, i) => ({
    code: s.code,
    name: s.name,
    state: s.state,
    etaMinutes: 45 + i * 60,
distanceRemaining: Math.round(distanceToIndex(polyline, currentIdx + 1 + i + 1) - distanceCovered),
  }));

  const toStation = stationByCode(train.to);
  const destination = toStation
    ? {
        code: toStation.code,
        name: toStation.name,
        state: toStation.state,
        lat: toStation.lat,
        lng: toStation.lng,
        platform: platformFor(toStation.code),
      }
    : { code: train.to, name: train.to };

  const currentPlatform = currentStation ? platformFor(currentStation.code) : null;

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
    destination,
    currentPlatform,
    livePosition: livePos
      ? { lat: Number(livePos[0].toFixed(4)), lng: Number(livePos[1].toFixed(4)) }
      : null,
    progress: Math.round(liveProgress * 100),
    distanceCovered: Math.round(distanceCovered),
    distanceRemaining: Math.round(distanceRemaining),
    totalDistance: Math.round(totalDistance),
    lastUpdate: new Date().toISOString(),
    upcoming,
    routeStations,
    polyline,
  });
});

export default router;
