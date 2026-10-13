// Haversine distance in km between two lat/lng points
export const haversineKm = (p1, p2) => {
  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Total route distance in km
export const routeDistance = (polyline) => {
  let total = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    total += haversineKm(polyline[i], polyline[i + 1]);
  }
  return total;
};

// Distance along route up to a given index
export const distanceToIndex = (polyline, index) => {
  let total = 0;
  for (let i = 0; i < index && i < polyline.length - 1; i++) {
    total += haversineKm(polyline[i], polyline[i + 1]);
  }
  return total;
};

// Interpolate a point along a route segment by progress (0..1)
export const interpolatePoint = (polyline, progress) => {
  if (polyline.length === 0) return null;
  if (progress <= 0) return polyline[0];
  if (progress >= 1) return polyline[polyline.length - 1];

  const total = routeDistance(polyline);
  const target = total * progress;
  let acc = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const seg = haversineKm(polyline[i], polyline[i + 1]);
    if (acc + seg >= target) {
      const t = (target - acc) / seg;
      return [
        polyline[i][0] + (polyline[i + 1][0] - polyline[i][0]) * t,
        polyline[i][1] + (polyline[i + 1][1] - polyline[i][1]) * t,
      ];
    }
    acc += seg;
  }
  return polyline[polyline.length - 1];
};

// Elevation profile from station elevations
export const elevationProfile = (routeCodes, stationMap) => {
  return routeCodes.map((code, idx) => {
    const s = stationMap[code];
    return { station: s ? s.name : code, elevation: s ? s.elev : 0, index: idx };
  });
};

// Estimate current station index based on progress
export const currentStationIndex = (routeCodes, progress) => {
  const idx = Math.floor(progress * (routeCodes.length - 1));
  return Math.min(idx, routeCodes.length - 1);
};
