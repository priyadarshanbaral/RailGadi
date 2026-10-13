import { trains } from "../data/trainIndex.js";
import { stationByCode, platformFor } from "../data/stationData.js";
import { buildRoutePolyline } from "../data/routes.js";
import {
  routeDistance,
  distanceToIndex,
  interpolatePoint,
  currentStationIndex,
  calculateBearing,
} from "./geo.js";

/**
 * Determine locomotive and technical specs by train type
 */
const getLocomotiveSpecs = (train) => {
  const t = (train.type || "").toLowerCase();
  const name = (train.name || "").toLowerCase();

  if (t.includes("vande") || name.includes("vande")) {
    return {
      locomotive: "Train 18 EMU Rake (Vande Bharat 2.0)",
      locoClass: "Distributed Traction 160 km/h",
      power: "3300 kW (Electric Multiple Unit)",
      traction: "25 kV 50Hz AC Overhead Catenary",
      coaches: "16 Coaches (Aero-dynamic LHB)",
      safetySystem: "KAVACH (Automatic Train Protection Active)",
    };
  }
  if (t.includes("rajdhani") || t.includes("tejas")) {
    return {
      locomotive: "WAP-7 (Class 218xx) 3-Phase AC",
      locoClass: "6000 HP Heavy Passenger Electric",
      power: "4475 kW High-Traction",
      traction: "25 kV 50Hz AC Overhead Catenary",
      coaches: "22 Coaches LHB Air-Conditioned",
      safetySystem: "KAVACH Collision Avoidance & TPWS",
    };
  }
  if (t.includes("shatabdi")) {
    return {
      locomotive: "WAP-5 High-Speed 3-Phase AC",
      locoClass: "5450 HP High-Speed Passenger",
      power: "4064 kW",
      traction: "25 kV 50Hz AC Overhead Catenary",
      coaches: "18 Coaches LHB Chair Car",
      safetySystem: "TPWS / AWS Speed Enforcement Active",
    };
  }
  if (t.includes("duronto")) {
    return {
      locomotive: "WAP-7 High-Efficiency AC Electric",
      locoClass: "6000 HP Point-to-Point Express",
      power: "4475 kW",
      traction: "25 kV 50Hz AC Overhead Catenary",
      coaches: "20 Coaches LHB Sleeper/AC",
      safetySystem: "KAVACH Auto Braking Enabled",
    };
  }
  return {
    locomotive: "WAP-4 / WDG-4D Mixed-Service Heavy",
    locoClass: "5000 HP Passenger Locomotive",
    power: "3700 kW",
    traction: "25 kV 50Hz AC Overhead / Dual Mode",
    coaches: "22 Coaches LHB / ICF",
    safetySystem: "Auxiliary Warning System (AWS)",
  };
};

/**
 * Calculate dynamic real-time live telemetry for a train
 */
export const calculateLiveTelemetry = (train, options = {}) => {
  const { simSpeed = 1, customTime } = options;
  const polyline = buildRoutePolyline(train.route);
  const totalDistance = Math.max(120, routeDistance(polyline));

  // Time-aware progress calculation
  const seed = train.number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const now = customTime ? Number(customTime) : Date.now();

  // Full journey simulation cycle: 6 hours (21,600,000 ms) adjusted by simSpeed
  const cycleMs = 21600000;
  const effectiveOffset = (now * Math.max(0.1, Number(simSpeed)) + seed * 3600000) % cycleMs;
  const rawProgress = effectiveOffset / cycleMs;
  // Train is between 4% and 96% of journey
  const progress = Math.max(0.04, Math.min(0.96, rawProgress));

  // Stations and current segment
  const routeStations = train.route.map((code) => stationByCode(code)).filter(Boolean);
  const stationCount = Math.max(2, routeStations.length);
  const currentIdx = Math.min(stationCount - 1, Math.floor(progress * stationCount));
  const currentStation = routeStations[currentIdx] || stationByCode(train.from);
  const nextStation = routeStations[Math.min(stationCount - 1, currentIdx + 1)] || null;

  // Distances
  const distanceCovered = Math.round(totalDistance * progress);
  const distanceRemaining = Math.max(0, Math.round(totalDistance - distanceCovered));

  // Current GPS Position
  const livePos = interpolatePoint(polyline, progress) || [28.6139, 77.209];
  const nextPos = interpolatePoint(polyline, Math.min(0.999, progress + 0.015)) || livePos;
  const bearing = calculateBearing(livePos[0], livePos[1], nextPos[0], nextPos[1]);

  // Max design speed by train type
  const isVande = train.type === "Vande Bharat";
  const isRaj = train.type === "Rajdhani" || train.type === "Tejas";
  const isShat = train.type === "Shatabdi";
  const topSpeed = isVande ? 145 : isRaj ? 130 : isShat ? 120 : 105;

  // Station proximity check for speed & signals
  const stationSegmentProgress = (progress * stationCount) % 1;
  const isNearStation = stationSegmentProgress < 0.08 || stationSegmentProgress > 0.92;
  const isHalting = stationSegmentProgress < 0.03;

  let speed = 0;
  let signal = "CLEAR";
  let signalColor = "#10b981"; // green
  let dwellStatus = "Cruising";

  if (isHalting) {
    speed = 0;
    signal = "HALT";
    signalColor = "#ef4444"; // red
    dwellStatus = `Station Halt at ${currentStation?.name || "Platform"} (2 min scheduled stop)`;
  } else if (isNearStation) {
    const approachSpeed = Math.round(30 + Math.abs(Math.sin(now / 3000)) * 12);
    speed = approachSpeed;
    signal = "CAUTION";
    signalColor = "#f59e0b"; // yellow
    dwellStatus = `Approaching ${nextStation?.name || currentStation?.name} on Platform ${currentStation?.platform || 1}`;
  } else {
    const oscillation = Math.sin(now / 7000 + seed) * 8;
    speed = Math.round(topSpeed - 10 + oscillation);
    signal = "CLEAR";
    signalColor = "#10b981"; // green
    dwellStatus = `High-speed cruising towards ${nextStation?.name || "Next Junction"}`;
  }

  // Live ETA to next station in minutes
  const distToNext = nextStation
    ? Math.max(4, Math.round((totalDistance / stationCount) * (1 - stationSegmentProgress)))
    : 0;
  const etaMinutesToNext = Math.max(1, Math.round((distToNext / Math.max(25, speed)) * 60));

  // Upcoming station list with platforms & live ETAs
  const upcoming = routeStations.slice(currentIdx + 1).map((s, i) => {
    const cumulativeDist = Math.round(distToNext + (i * (totalDistance / stationCount)));
    const etaMin = Math.round(etaMinutesToNext + (i * 45));
    const arrivalTime = new Date(now + etaMin * 60000);
    return {
      code: s.code,
      name: s.name,
      state: s.state,
      platform: platformFor(s.code) || (i % 6) + 1,
      etaMinutes: etaMin,
      arrivalTimeFormatted: arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      distanceRemaining: cumulativeDist,
      status: i === 0 ? "Next Stop" : "Upcoming",
    };
  });

  // Passed stations
  const passed = routeStations.slice(0, currentIdx).map((s, i) => ({
    code: s.code,
    name: s.name,
    state: s.state,
    platform: platformFor(s.code) || (i % 6) + 1,
    status: "Departed",
  }));

  const toStation = stationByCode(train.to);
  const destination = toStation
    ? {
        code: toStation.code,
        name: toStation.name,
        state: toStation.state,
        lat: toStation.lat,
        lng: toStation.lng,
        platform: platformFor(toStation.code) || 1,
      }
    : { code: train.to, name: train.to, platform: 1 };

  // Split polyline into completed & remaining
  const splitIdx = Math.max(1, Math.floor(progress * polyline.length));
  const completedPolyline = polyline.slice(0, splitIdx);
  const remainingPolyline = polyline.slice(Math.max(0, splitIdx - 1));

  // Delay calculation
  const currentDelay = train.delay || 0;
  const isDelayed = currentDelay > 0;

  return {
    train: {
      number: train.number,
      name: train.name,
      type: train.type,
      status: isDelayed ? "Delayed" : "On Time",
      delay: currentDelay,
      from: stationByCode(train.from)?.name || train.from,
      to: stationByCode(train.to)?.name || train.to,
      fromCode: train.from,
      toCode: train.to,
    },
    telemetry: {
      speedKmH: speed,
      topPermissibleSpeed: topSpeed,
      signal,
      signalColor,
      bearing,
      dwellStatus,
      isHalting,
      satellites: 14,
      gpsAccuracy: "±1.8m (NavIC / GPS L1+L5)",
      lastFix: new Date(now).toISOString(),
      simSpeed: Number(simSpeed) || 1,
      ...getLocomotiveSpecs(train),
    },
    livePosition: {
      lat: Number(livePos[0].toFixed(5)),
      lng: Number(livePos[1].toFixed(5)),
    },
    progress: Math.round(progress * 100),
    distanceCovered,
    distanceRemaining,
    totalDistance: Math.round(totalDistance),
    currentStation: {
      code: currentStation?.code,
      name: currentStation?.name,
      state: currentStation?.state,
      platform: currentStation ? platformFor(currentStation.code) : 1,
      lat: currentStation?.lat,
      lng: currentStation?.lng,
    },
    nextStation: nextStation
      ? {
          code: nextStation.code,
          name: nextStation.name,
          state: nextStation.state,
          platform: platformFor(nextStation.code) || 1,
          etaMinutes: etaMinutesToNext,
          distanceKm: distToNext,
          lat: nextStation.lat,
          lng: nextStation.lng,
        }
      : null,
    destination,
    currentPlatform: currentStation ? platformFor(currentStation.code) : 1,
    lastUpdate: new Date(now).toISOString(),
    upcoming,
    passed,
    routeStations,
    polyline,
    completedPolyline,
    remainingPolyline,
  };
};

/**
 * Returns a live fleet of iconic trains for nationwide live radar
 */
export const getLiveRadarFleet = (options = {}) => {
  const radarTrainNumbers = [
    "12301", "12302", "12951", "12952", "22436", "22435",
    "20608", "12004", "12260", "12626", "11019", "11071",
    "10103", "13005", "15657", "12901"
  ];

  const fleet = radarTrainNumbers
    .map((num) => {
      const t = trains.find((x) => x.number === num);
      if (!t) return null;
      const tele = calculateLiveTelemetry(t, options);
      return {
        number: t.number,
        name: t.name,
        type: t.type,
        status: tele.train.status,
        delay: tele.train.delay,
        speedKmH: tele.telemetry.speedKmH,
        signal: tele.telemetry.signal,
        bearing: tele.telemetry.bearing,
        dwellStatus: tele.telemetry.dwellStatus,
        progress: tele.progress,
        livePosition: tele.livePosition,
        currentStation: tele.currentStation?.name,
        nextStation: tele.nextStation?.name,
        destination: tele.destination?.name,
        from: tele.train.from,
        to: tele.train.to,
      };
    })
    .filter(Boolean);

  return fleet;
};

