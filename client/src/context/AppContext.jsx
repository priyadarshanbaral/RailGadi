import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../api/client.js";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("railgaadi-recent") || "[]");
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("railgaadi-favs") || "[]");
    } catch {
      return [];
    }
  });

  // ─── Auth state (MongoDB-backed user data) ───
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("railgaadi-user") || "null");
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("railgaadi-token") || "");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("railgaadi-recent", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem("railgaadi-favs", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (user) localStorage.setItem("railgaadi-user", JSON.stringify(user));
    else localStorage.removeItem("railgaadi-user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("railgaadi-token", token);
    else localStorage.removeItem("railgaadi-token");
  }, [token]);

  const addRecentSearch = useCallback((train) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t.number !== train.number);
      return [train, ...filtered].slice(0, 5);
    });
  }, []);

  const toggleFavorite = useCallback((train) => {
    setFavorites((prev) => {
      const exists = prev.some((t) => t.number === train.number);
      if (exists) return prev.filter((t) => t.number !== train.number);
      return [train, ...prev];
    });
  }, []);

  const isFavorite = useCallback((number) => favorites.some((t) => t.number === number), [favorites]);

// ─── Auth methods (Twilio phone verification + RailGaadi accounts) ────────
  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      return { ok: true, user: res.user };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const sendOtp = useCallback(async (name, email, phone, password, confirmPassword) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.sendOtp({ name, email, phone, password, confirmPassword });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const sendPhoneOtp = useCallback(async (phone, purpose = "login") => {
    setAuthLoading(true);
    try {
      const res = await api.auth.sendOtp({ phone, purpose });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (registration, otp) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.verifyOtp({ ...registration, otp });
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
      }
      return { ok: true, user: res.user, message: res.message, phoneVerified: res.phoneVerified };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const resendOtp = useCallback(async (phone) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.resendOtp({ phone });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const completePasswordReset = useCallback(async (phone, otp, newPassword) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.verifyOtp({ phone, otp, newPassword });
      return { ok: true, message: res.message };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken("");
  }, []);

  const value = useMemo(
    () => ({
      recentSearches,
      favorites,
      addRecentSearch,
      toggleFavorite,
      isFavorite,
      // auth
      user,
      token,
      authLoading,
      login,
      sendOtp,
      sendPhoneOtp,
      verifyOtp,
      resendOtp,
      completePasswordReset,
      logout,
    }),
    [
      recentSearches,
      favorites,
      addRecentSearch,
      toggleFavorite,
      isFavorite,
      user,
      token,
      authLoading,
      login,
      sendOtp,
      sendPhoneOtp,
      verifyOtp,
      resendOtp,
      completePasswordReset,
      logout,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
