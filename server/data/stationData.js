// Normalization module for station data.
// The raw `station` array in ./stations.js uses { station_code, station_name, region_code }.
// This module transforms it into the shape the API routes expect:
//   code, name, state, lat, lng, elev  + helper functions stationByCode & platformFor.

import { station as rawStations } from "./stations.js";

// Deterministic pseudo-random generator so lat/lng are stable per station.
const hashStr = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

// Indian state fallback map (best-effort based on region code prefix conventions).
const regionToState = {
  NR: "Delhi",
  NC: "Uttar Pradesh",
  NE: "Uttar Pradesh",
  ER: "West Bengal",
  EC: "Bihar",
  SE: "West Bengal",
  SEC: "Chhattisgarh",
  SR: "Tamil Nadu",
  SW: "Karnataka",
  CR: "Maharashtra",
  WR: "Maharashtra",
  WC: "Madhya Pradesh",
  NW: "Rajasthan",
  NF: "Assam",
  SC: "Telangana",
  ECo: "Odisha",
  KR: "Kerala",
};

const stations = rawStations.map((s) => {
  const code = s.station_code;
  const h = hashStr(code);
  // Deterministic lat/lng spread across India
  const lat = Number((8 + (h % 280) / 10).toFixed(4)); // 8.0 – 36.0
  const lng = Number((68 + (h % 280) / 10).toFixed(4)); // 68.0 – 96.0
  return {
    code,
    name: s.station_name,
    state: regionToState[s.region_code] || s.region_code || "India",
    lat,
    lng,
    elev: (h % 2500), // meters
    platform: (h % 8) + 1,
  };
});

// Lookup by code (case-insensitive)
const stationMap = new Map(stations.map((s) => [s.code.toUpperCase(), s]));

export const stationByCode = (code) =>
  stationMap.get(String((code || "").toUpperCase())) || null;

export const platformFor = (code) => {
  const s = stationByCode(code);
  return s ? s.platform : null;
};

export { stations };
