// Normalization module for train data.
// The raw `trains` array in ./trains.js uses { trainNumber, trainName, route, runningDays, trainRoute }.
// Each trainRoute entry has stationName in "NAME - CODE" format.
// This module transforms it into the shape the API routes expect:
//   number, name, type, status, delay, from, to, route (array of codes) + helper findTrain(query).

import { trains as rawTrains } from "./trains.js";

// Extract the station code from a "STATION NAME - CODE" string (last token after " - ").
const codeFromStationName = (stationName) => {
  if (!stationName) return null;
  const match = stationName.match(/\b([A-Z]{1,6})\s*$/);
  return match ? match[1] : null;
};

// Infer train type from the train name.
const inferType = (name) => {
  const n = (name || "").toUpperCase();
  if (/\bRAJDHANI\b/.test(n)) return "Rajdhani";
  if (/\bSHATABDI\b/.test(n)) return "Shatabdi";
  if (/\bVANDE\s*BHARAT\b/.test(n)) return "Vande Bharat";
  if (/\bDOUBLE\s*DECKER\b/.test(n)) return "Double Decker";
  if (/\bGARIB\s*RATH\b/.test(n)) return "Garib Rath";
  if (/\bDURONTO\b/.test(n)) return "Duronto";
  if (/\bTEJAS\b/.test(n)) return "Tejas";
  if (/\bINTERCITY\b/.test(n)) return "Intercity";
  if (/\bSUPER\s*FAST\b|\bS\.?F\.?\b|\bSUF\b/.test(n)) return "Superfast";
  if (/\bEXPRESS\b|\bEXP\b/.test(n)) return "Express";
  if (/\bMAIL\b/.test(n)) return "Mail";
  if (/\bPASSENGER\b|\bPASS\b/.test(n)) return "Passenger";
  if (/\bDEMU\b|\bEMU\b|\bMEMU\b/.test(n)) return "Local";
  if (/\bSPECIAL\b|\bSPL\b/.test(n)) return "Special";
  return "Express";
};

// Deterministic pseudo-random delay based on train number (0 - 25 min).
const delayFor = (number) => {
  const h = number.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const delay = h % 26; // 0-25
  return delay > 2 ? delay : 0; // most trains on time-ish
};

// Normalize a raw train record.
const normalizeTrain = (raw) => {
  const routeCodes = (raw.trainRoute || []).map((s) => codeFromStationName(s.stationName)).filter(Boolean);
  const from = routeCodes[0] || raw.route?.split(" to ")[0] || "";
  const to = routeCodes[routeCodes.length - 1] || raw.route?.split(" to ")[1]?.split(" - ")[0] || "";
  const delay = delayFor(raw.trainNumber);
  return {
    number: raw.trainNumber,
    name: raw.trainName,
    type: inferType(raw.trainName),
    status: delay > 0 ? "Delayed" : "On Time",
    delay,
    from,
    to,
    route: routeCodes,
    timetable: raw.trainRoute || [],
    runningDays: raw.runningDays || {},
  };
};

const FLAGSHIP_TRAINS = [
  {
    number: "12301",
    name: "HOWRAH RAJDHANI EXPRESS",
    type: "Rajdhani",
    status: "On Time",
    delay: 0,
    from: "HWH",
    to: "NDLS",
    route: ["HWH", "ASN", "DHN", "GAYA", "DDU", "PRYJ", "CNB", "NDLS"],
    runningDays: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false },
  },
  {
    number: "12302",
    name: "NEW DELHI - HOWRAH RAJDHANI",
    type: "Rajdhani",
    status: "Delayed",
    delay: 15,
    from: "NDLS",
    to: "HWH",
    route: ["NDLS", "CNB", "PRYJ", "DDU", "GAYA", "DHN", "ASN", "HWH"],
    runningDays: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true },
  },
  {
    number: "12951",
    name: "MUMBAI TEJAS RAJDHANI",
    type: "Rajdhani",
    status: "On Time",
    delay: 0,
    from: "BCT",
    to: "NDLS",
    route: ["BCT", "ST", "BRC", "RTM", "KOTA", "NDLS"],
    runningDays: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true },
  },
  {
    number: "12952",
    name: "NEW DELHI - MUMBAI RAJDHANI",
    type: "Rajdhani",
    status: "On Time",
    delay: 0,
    from: "NDLS",
    to: "BCT",
    route: ["NDLS", "KOTA", "RTM", "BRC", "ST", "BCT"],
    runningDays: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true },
  },
  {
    number: "22436",
    name: "VARANASI VANDE BHARAT EXP",
    type: "Vande Bharat",
    status: "On Time",
    delay: 0,
    from: "NDLS",
    to: "BSB",
    route: ["NDLS", "CNB", "PRYJ", "BSB"],
    runningDays: { Sun: true, Mon: false, Tue: true, Wed: true, Thu: false, Fri: true, Sat: true },
  },
  {
    number: "22435",
    name: "VANDE BHARAT EXPRESS",
    type: "Vande Bharat",
    status: "On Time",
    delay: 0,
    from: "BSB",
    to: "NDLS",
    route: ["BSB", "PRYJ", "CNB", "NDLS"],
    runningDays: { Sun: true, Mon: false, Tue: true, Wed: true, Thu: false, Fri: true, Sat: true },
  },
  {
    number: "20608",
    name: "MYSURU - CHENNAI VANDE BHARAT",
    type: "Vande Bharat",
    status: "On Time",
    delay: 0,
    from: "MYS",
    to: "MAS",
    route: ["MYS", "SBC", "MAS"],
    runningDays: { Sun: true, Mon: true, Tue: true, Wed: false, Thu: true, Fri: true, Sat: true },
  },
  {
    number: "12004",
    name: "LUCKNOW SWARNA SHATABDI",
    type: "Shatabdi",
    status: "Delayed",
    delay: 8,
    from: "NDLS",
    to: "LKO",
    route: ["NDLS", "AGC", "CNB", "LKO"],
    runningDays: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true },
  },
  {
    number: "12260",
    name: "SEALDAH AC DURONTO",
    type: "Duronto",
    status: "On Time",
    delay: 0,
    from: "NDLS",
    to: "SDAH",
    route: ["NDLS", "CNB", "DDU", "DHN", "SDAH"],
    runningDays: { Sun: false, Mon: true, Tue: false, Wed: true, Thu: false, Fri: true, Sat: false },
  },
  {
    number: "12626",
    name: "KERALA EXPRESS",
    type: "Superfast",
    status: "Delayed",
    delay: 18,
    from: "NDLS",
    to: "TVC",
    route: ["NDLS", "AGC", "GWL", "BPL", "NGP", "TVC"],
    runningDays: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true },
  },
];

const parsedTrains = rawTrains.map(normalizeTrain);

// Combine flagship trains ahead so they take priority
const trains = [
  ...FLAGSHIP_TRAINS,
  ...parsedTrains.filter((t) => !FLAGSHIP_TRAINS.some((f) => f.number === t.number)),
];

// Search by number or name (case-insensitive substring).
export const findTrain = (query) => {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  return trains.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.number.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
  );
};

export { trains };
