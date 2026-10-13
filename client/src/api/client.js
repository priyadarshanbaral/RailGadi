const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const request = async (path, options = {}) => {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    // fetch() itself failed — the API is unreachable (server down or proxy error).
    throw new Error(
      "Cannot reach the server. Make sure the API is running on port 5000 and try again."
    );
  }

  const raw = await res.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // Non-JSON response body (e.g. a proxy error page).
      data = { error: raw.slice(0, 200) };
    }
  }

  if (!res.ok) {
    throw new Error(
      data.error ||
        (res.status >= 500
          ? "The server ran into a problem. Please try again in a moment."
          : `Request failed (${res.status}).`)
    );
  }
  return data;
};

const jsonRequest = (method) => (path, body) =>
  request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const api = {
  // Trains
getAllTrains: () => request("/trains/all"),
  searchTrains: (q) => request(`/trains/search?q=${encodeURIComponent(q)}`),
  searchByRoute: (from, to) =>
    request(`/trains/search-route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  getTrainsByStation: (code) => request(`/trains/by-station/${encodeURIComponent(code)}`),
  getTrainLive: (number, simSpeed = 1) => request(`/trains/${encodeURIComponent(number)}?simSpeed=${simSpeed}`),
  getLiveRadar: (simSpeed = 1) => request(`/trains/live-radar?simSpeed=${simSpeed}`),

  // Stations
  getStations: () => request("/stations"),
  getStation: (code) => request(`/stations/${encodeURIComponent(code)}`),
  searchStations: (q) => request(`/stations/search?q=${encodeURIComponent(q)}`),
  getStationTrains: (code) => request(`/stations/${encodeURIComponent(code)}/trains`),

  // Analytics
  getAnalytics: (number) => request(`/analytics/${number}`),

  // Companion
  getCompanion: (number) => request(`/companion/${number}`),

  // Map
  getMapData: (number) => request(`/map/${number}`),

  // ─── New REST API spec ───────────────────────────────

  // /api/train
  train: {
    search: (q) => request(`/train/search?q=${encodeURIComponent(q)}`),
    live: (number) => request(`/train/live/${number}`),
    route: (number) => request(`/train/route/${number}`),
    stations: (number) => request(`/train/stations/${number}`),
    analytics: (number) => request(`/train/analytics/${number}`),
  },

  // /api/weather
  weather: {
    current: (station) => request(`/weather/current?station=${encodeURIComponent(station)}`),
    forecast: (station) => request(`/weather/forecast?station=${encodeURIComponent(station)}`),
    routeWeather: (trainNumber) =>
      request(`/weather/route-weather?trainNumber=${encodeURIComponent(trainNumber)}`),
  },

// /api/user
user: {
login: (body) => jsonRequest("POST")("/user/login", body),
    getFavorites: (token) =>
      request("/user/favorites", { headers: { Authorization: `Bearer ${token}` } }),
    addFavorite: (token, trainNumber) =>
      request("/user/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trainNumber }),
      }),
    removeFavorite: (token, trainNumber) =>
      request("/user/favorite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trainNumber }),
      }),
  },

  // /api/auth (REST registration with phone OTP verification & User ID)
  auth: {
    sendOtp: (body) => jsonRequest("POST")("/otp/send", body),
    verifyOtp: (body) => jsonRequest("POST")("/otp/verify", body),
    resendOtp: (body) => jsonRequest("POST")("/auth/resend-otp", body),
    login: (body) => jsonRequest("POST")("/auth/login", body),
    profile: (token) =>
      request("/auth/profile", { headers: { Authorization: `Bearer ${token}` } }),
  },

  // /api/ai
  ai: {
    assistant: (query, trainNumber) =>
      jsonRequest("POST")("/ai/assistant", { query, trainNumber }),
    prediction: (trainNumber, simSpeed = 1) =>
      request(`/ai/prediction/${encodeURIComponent(trainNumber)}?simSpeed=${simSpeed}`),
  },
};
