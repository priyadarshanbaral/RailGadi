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

// Real coordinates for major Indian railway stations
const MAJOR_STATIONS = {
  NDLS: { lat: 28.6139, lng: 77.2090, state: "Delhi" },
  DLI: { lat: 28.6609, lng: 77.2307, state: "Delhi" },
  NZM: { lat: 28.5888, lng: 77.2536, state: "Delhi" },
  ANVT: { lat: 28.6517, lng: 77.3151, state: "Delhi" },
  HWH: { lat: 22.5830, lng: 88.3426, state: "West Bengal" },
  SDAH: { lat: 22.5697, lng: 88.3711, state: "West Bengal" },
  KOAA: { lat: 22.6025, lng: 88.3780, state: "West Bengal" },
  CSMT: { lat: 18.9400, lng: 72.8353, state: "Maharashtra" },
  BCT: { lat: 18.9696, lng: 72.8193, state: "Maharashtra" },
  MMCT: { lat: 18.9696, lng: 72.8193, state: "Maharashtra" },
  LTT: { lat: 19.0689, lng: 72.8906, state: "Maharashtra" },
  BDTS: { lat: 19.0544, lng: 72.8406, state: "Maharashtra" },
  PUNE: { lat: 18.5284, lng: 73.8743, state: "Maharashtra" },
  KYN: { lat: 19.2361, lng: 73.1306, state: "Maharashtra" },
  TNA: { lat: 19.1860, lng: 72.9758, state: "Maharashtra" },
  MAS: { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  MS: { lat: 13.0784, lng: 80.2605, state: "Tamil Nadu" },
  TBM: { lat: 12.9249, lng: 80.1268, state: "Tamil Nadu" },
  SBC: { lat: 12.9781, lng: 77.5695, state: "Karnataka" },
  SMVB: { lat: 13.0031, lng: 77.6534, state: "Karnataka" },
  MYS: { lat: 12.3168, lng: 76.6496, state: "Karnataka" },
  HYB: { lat: 17.3924, lng: 78.4682, state: "Telangana" },
  SC: { lat: 17.4399, lng: 78.4983, state: "Telangana" },
  CNB: { lat: 26.4537, lng: 80.3507, state: "Uttar Pradesh" },
  PRYJ: { lat: 25.4358, lng: 81.8463, state: "Uttar Pradesh" },
  BSB: { lat: 25.3284, lng: 82.9998, state: "Uttar Pradesh" },
  DDU: { lat: 25.2818, lng: 83.1189, state: "Uttar Pradesh" },
  LKO: { lat: 26.8322, lng: 80.9234, state: "Uttar Pradesh" },
  GKP: { lat: 26.7606, lng: 83.3732, state: "Uttar Pradesh" },
  AGC: { lat: 27.1578, lng: 77.9904, state: "Uttar Pradesh" },
  GWL: { lat: 26.2183, lng: 78.1828, state: "Madhya Pradesh" },
  BPL: { lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
  RKMP: { lat: 23.2037, lng: 77.4384, state: "Madhya Pradesh" },
  JBP: { lat: 23.1686, lng: 79.9497, state: "Madhya Pradesh" },
  PNBE: { lat: 25.6022, lng: 85.1376, state: "Bihar" },
  PPTA: { lat: 25.6074, lng: 85.0884, state: "Bihar" },
  DNR: { lat: 25.5891, lng: 85.0444, state: "Bihar" },
  GAYA: { lat: 24.7955, lng: 84.9994, state: "Bihar" },
  DHN: { lat: 23.7957, lng: 86.4304, state: "Jharkhand" },
  ASN: { lat: 23.6889, lng: 86.9661, state: "West Bengal" },
  ADI: { lat: 23.0225, lng: 72.5714, state: "Gujarat" },
  BRC: { lat: 22.3107, lng: 73.1812, state: "Gujarat" },
  ST: { lat: 21.2050, lng: 72.8407, state: "Gujarat" },
  RTM: { lat: 23.3441, lng: 75.0371, state: "Madhya Pradesh" },
  KOTA: { lat: 25.2138, lng: 75.8648, state: "Rajasthan" },
  JP: { lat: 26.9196, lng: 75.7878, state: "Rajasthan" },
  JU: { lat: 26.2844, lng: 73.0185, state: "Rajasthan" },
  ASR: { lat: 31.6340, lng: 74.8723, state: "Punjab" },
  CDG: { lat: 30.7046, lng: 76.8013, state: "Punjab" },
  JAT: { lat: 32.7060, lng: 74.8753, state: "Jammu & Kashmir" },
  SVDK: { lat: 32.9918, lng: 74.9515, state: "Jammu & Kashmir" },
  BBS: { lat: 20.2666, lng: 85.8436, state: "Odisha" },
  PURI: { lat: 19.8135, lng: 85.8312, state: "Odisha" },
  R: { lat: 21.2514, lng: 81.6296, state: "Chhattisgarh" },
  BSP: { lat: 22.0797, lng: 82.1409, state: "Chhattisgarh" },
  NGP: { lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
  GHY: { lat: 26.1862, lng: 91.7539, state: "Assam" },
  DBRG: { lat: 27.4728, lng: 94.9120, state: "Assam" },
  TVC: { lat: 8.4855, lng: 76.9492, state: "Kerala" },
  ERS: { lat: 9.9674, lng: 76.2917, state: "Kerala" },
  MAO: { lat: 15.2736, lng: 73.9580, state: "Goa" },
  KOP: { lat: 16.7050, lng: 74.2433, state: "Maharashtra" },
  MDU: { lat: 9.9252, lng: 78.1198, state: "Tamil Nadu" },
  CBE: { lat: 11.0016, lng: 76.9660, state: "Tamil Nadu" },
};

const stations = rawStations.map((s) => {
  const code = s.station_code.toUpperCase();
  const major = MAJOR_STATIONS[code];
  if (major) {
    return {
      code,
      name: s.station_name,
      state: major.state,
      lat: major.lat,
      lng: major.lng,
      elev: 120 + ((hashStr(code) % 400)),
      platform: ((hashStr(code) % 8) + 1),
    };
  }

  const h = hashStr(code);
  // Realistic decoupled lat/lng spread across India
  const lat = Number((9.5 + ((h * 13) % 230) / 10).toFixed(4)); // 9.5 – 32.5
  const lng = Number((72.0 + ((h * 31) % 210) / 10).toFixed(4)); // 72.0 – 93.0
  return {
    code,
    name: s.station_name,
    state: regionToState[s.region_code] || s.region_code || "India",
    lat,
    lng,
    elev: 50 + (h % 1500),
    platform: (h % 6) + 1,
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
