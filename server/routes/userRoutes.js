import { Router } from "express";
import mongoose from "mongoose";
import { trains } from "../data/trainIndex.js";
import User from "../models/User.js";
import { isDBConnected } from "../config/db.js";
import { sendRegistrationConfirmation } from "../utils/sendRegistrationConfirmation.js";
import { generateUserId } from "../utils/userId.js";

const router = Router();

// ─── In-memory fallback user store (used when MongoDB is unavailable) ───
const memoryUsers = []; // { id, name, email, password, createdAt }
const favorites = new Map(); // userId -> Set of train numbers
let memoryIdCounter = 1;

const toPublicUser = (u) => ({
  id: String(u.id ?? u._id),
  userId: u.userId || "",
  name: u.name,
  email: u.email,
  createdAt: u.createdAt || new Date().toISOString(),
});

const tokenFor = (id) => Buffer.from(`rg-user-${id}`).toString("base64");

const idFromToken = (token) => {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const match = decoded.match(/rg-user-(\w+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

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

// ─── POST /api/user/register — save user to MongoDB ─────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email and password are required" });
  }

  try {
    if (isDBConnected()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
        return res
          .status(409)
          .json({ error: "User already exists with this email" });
      }
      const userId = await generateUserId();
      const user = await User.create({
        userId,
        name,
        email: email.toLowerCase(),
        password,
      });
      // Initialize favorites for this user in-memory (demo)
      favorites.set(String(user._id), new Set());

      const emailResult = await sendRegistrationConfirmation({
        name: user.name,
        email: user.email,
        userId: user.userId,
        createdAt: user.createdAt,
      });

      return res.status(201).json({
        message: "Registration successful",
        user: toPublicUser(user),
        token: user.generateToken(),
        email: emailResult,
      });
    }

    // In-memory fallback
    if (memoryUsers.some((u) => u.email === email.toLowerCase())) {
      return res
        .status(409)
        .json({ error: "User already exists with this email" });
    }
    const user = {
      id: memoryIdCounter++,
      userId: await generateUserId(memoryUsers.length),
      name,
      email: email.toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    };
    memoryUsers.push(user);
    favorites.set(user.id, new Set());

    const emailResult = await sendRegistrationConfirmation({
      name: user.name,
      email: user.email,
      userId: user.userId,
      createdAt: user.createdAt,
    });

    return res.status(201).json({
      message: "Registration successful",
      user: toPublicUser(user),
      token: tokenFor(user.id),
      email: emailResult,
    });
  } catch (err) {
    // Log the real error server-side for diagnosis
    console.error("❌ Registration error:", err?.stack || err);

    // Mongoose validation errors (e.g. invalid email, short password) are a
    // client problem, not a server crash — return 400 with a useful message.
    if (err?.name === "ValidationError") {
      const msg = Object.values(err.errors || {})
        .map((e) => e.message)
        .join("; ");
      return res.status(400).json({ error: msg || "Validation failed" });
    }

    // Duplicate key (email already exists) race condition → 409
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "User already exists with this email" });
    }

    return res
      .status(500)
      .json({ error: err?.message || "Registration failed. Please try again." });
  }
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
      return res
        .status(404)
        .json({ error: "User not found. Please register first." });
    }

    // Direct password comparison (per requirements — no bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: "Incorrect password. Try again." });
    }

    favorites.set(String(user.id ?? user._id), new Set());
    return res.json({
      user: toPublicUser(user),
      token: tokenFor(user.id ?? user._id),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/user/forgot-password — reset password ────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ error: "email and newPassword are required" });
  }

  try {
    if (isDBConnected()) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res
          .status(404)
          .json({ error: "No account found with this email." });
      }
      user.password = newPassword;
      await user.save();
      return res.json({
        message: "Password reset successful. Please login with your new password.",
      });
    }

    const user = memoryUsers.find((u) => u.email === email.toLowerCase());
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with this email." });
    }
    user.password = newPassword;
    return res.json({
      message: "Password reset successful. Please login with your new password.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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

