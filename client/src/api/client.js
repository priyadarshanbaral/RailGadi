const BASE = "/api";

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
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
  getTrainLive: (number) => request(`/trains/${number}`),

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
    register: (body) => jsonRequest("POST")("/user/register", body),
    login: (body) => jsonRequest("POST")("/user/login", body),
    forgotPassword: (body) => jsonRequest("POST")("/user/forgot-password", body),
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

// /api/auth (new REST registration flow with User ID + welcome email)
  auth: {
    register: (body) => jsonRequest("POST")("/auth/register", body),
    login: (body) => jsonRequest("POST")("/auth/login", body),
    profile: (token) =>
      request("/auth/profile", { headers: { Authorization: `Bearer ${token}` } }),
  },

  // /api/ai
  ai: {
    assistant: (query, trainNumber) =>
      jsonRequest("POST")("/ai/assistant", { query, trainNumber }),
  },
};
