import { Router } from "express";
import mongoose from "mongoose";
import { trains } from "../data/trainIndex.js";
import User from "../models/User.js";
import { isDBConnected } from "../config/db.js";
import { signAuthToken, verifyAuthToken } from "../utils/authToken.js";
import { isHashedPassword, verifyPassword } from "../utils/passwords.js";

const router = Router();

// ─── In-memory fallback user store (used when MongoDB is unavailable) ───
const memoryUsers = []; // { id, name, email, password, createdAt }
const favorites = new Map(); // userId -> Set of train numbers

const toPublicUser = (u) => ({
  id: String(u.id ?? u._id),
  userId: u.userId || "",
  name: u.name,
  email: u.email,
  phone: u.phone,
  createdAt: u.createdAt || new Date().toISOString(),
});

const tokenFor = signAuthToken;
const idFromToken = verifyAuthToken;

// ─── Helpers ────────────────────────────────────────────────────────────

// Find a user by id (checks MongoDB first, then in-memory)
const findUserById = async (id) => {
  if (isDBConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        return await User.findById(id);
      }
    } catch {
      /* ignore */
    }
  }
  return memoryUsers.find((u) => String(u.id) === String(id)) || null;
};

// Direct registration is disabled so that phone verification cannot be bypassed.
router.post("/register", async (req, res) => {
  return res.status(410).json({
    error: "Phone verification is required. Start with POST /api/auth/send-otp.",
  });
});

// ─── POST /api/user/login — verify email + password ─────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    let user = null;
    if (isDBConnected()) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = memoryUsers.find((u) => u.email === email.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!isHashedPassword(user.password) && typeof user.save === "function") {
      user.password = password;
      await user.save();
    }

    favorites.set(String(user.id ?? user._id), new Set());
    return res.json({
      user: toPublicUser(user),
      token: tokenFor(user.id ?? user._id),
    });
  } catch (err) {
    console.error("[user/login] Login failed:", err.name);
    return res.status(500).json({ error: "Login failed due to a server error. Please try again." });
  }
});

// Password recovery requires a Twilio-verified account phone.
router.post("/forgot-password", async (req, res) => {
  return res.status(410).json({
    error: "Email-only password resets are disabled. Verify your account phone with POST /api/otp/send and POST /api/otp/verify.",
  });
});

// ─── Auth middleware ────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : header;
  if (!token)
    return res.status(401).json({ error: "Unauthorized — missing token" });

  const id = idFromToken(token);
  if (!id)
    return res.status(401).json({ error: "Unauthorized — invalid token" });

  const user = await findUserById(id);
  if (!user)
    return res.status(401).json({ error: "Unauthorized — invalid token" });

  req.userId = String(user.id ?? user._id);
  next();
};

// ─── GET /api/user/favorites ────────────────────────────────────────────
router.get("/favorites", authenticate, (req, res) => {
  const favs = favorites.get(req.userId) || new Set();
  const list = trains
    .filter((t) => favs.has(t.number))
    .map((t) => ({
      number: t.number,
      name: t.name,
      from: t.from,
      to: t.to,
      type: t.type,
      status: t.status,
      delay: t.delay,
    }));
  res.json(list);
});

// ─── POST /api/user/favorite — add train to favourites ──────────────────
router.post("/favorite", authenticate, (req, res) => {
  const { trainNumber } = req.body || {};
  if (!trainNumber)
    return res.status(400).json({ error: "trainNumber is required" });
  if (!trains.some((t) => t.number === trainNumber)) {
    return res.status(404).json({ error: "Train not found" });
  }

  const favs = favorites.get(req.userId) || new Set();
  favs.add(trainNumber);
  favorites.set(req.userId, favs);

  res
    .status(201)
    .json({ message: `Added ${trainNumber} to favorites`, favorites: [...favs] });
});

// ─── DELETE /api/user/favorite — remove train from favourites ───────────
router.delete("/favorite", authenticate, (req, res) => {
  const { trainNumber } = req.body || {};
  if (!trainNumber)
    return res.status(400).json({ error: "trainNumber is required" });

  const favs = favorites.get(req.userId) || new Set();
  favs.delete(trainNumber);
  favorites.set(req.userId, favs);

  res.json({ message: `Removed ${trainNumber} from favorites`, favorites: [...favs] });
});

export default router;
