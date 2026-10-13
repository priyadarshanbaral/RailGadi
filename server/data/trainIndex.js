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
    runningDays: raw.runningDays || {},
  };
};

const trains = rawTrains.map(normalizeTrain);

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
