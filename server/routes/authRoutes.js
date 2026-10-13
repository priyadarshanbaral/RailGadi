import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { isDBConnected } from "../config/db.js";
import { generateUserId } from "../utils/userId.js";
import { sendRegistrationConfirmation } from "../utils/sendRegistrationConfirmation.js";

const router = Router();

// ─── In-memory fallback user store (used when MongoDB is unavailable) ───
const memoryUsers = []; // { id, userId, name, email, password, createdAt }
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

// ─── POST /api/auth/register — create account + send welcome email ───────
router.post("/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body || {};

  // 1) Required field validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email and password are required" });
  }
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Please enter your full name." });
  }

  // 2) Email format validation
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  // 3) Password validation
  if (String(password).length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters." });
  }

  // 4) Confirm password validation (if provided)
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  try {
    if (isDBConnected()) {
      // 5) Duplicate email check
      const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
      if (existing) {
        return res
          .status(409)
          .json({ error: "User already exists with this email" });
      }

      // 6) Generate unique User ID
      const userId = await generateUserId();

      // 7) Save user in MongoDB
      const user = await User.create({
        userId,
        name: name.trim(),
        email: String(email).trim().toLowerCase(),
        password,
      });

// 8) Send registration confirmation email
      //    (never blocks registration; no password included)
      const emailResult = await sendRegistrationConfirmation({
        name: user.name,
        email: user.email,
        userId: user.userId,
        createdAt: user.createdAt || new Date().toISOString(),
      }).catch((e) => {
        console.error("[auth/register] Email send threw unexpectedly:", e);
        return { success: false, error: e.message };
      });

      return res.status(201).json({
        message: "Registration successful",
        user: toPublicUser(user),
        token: user.generateToken(),
        email: emailResult,
      });
    }

    // ─── In-memory fallback ───
    if (memoryUsers.some((u) => u.email === String(email).trim().toLowerCase())) {
      return res
        .status(409)
        .json({ error: "User already exists with this email" });
    }
    const userId = await generateUserId(memoryUsers.length);
    const user = {
      id: memoryIdCounter++,
      userId,
      name: name.trim(),
      email: String(email).trim().toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    };
    memoryUsers.push(user);

const emailResult = await sendRegistrationConfirmation({
      name: user.name,
      email: user.email,
      userId: user.userId,
      createdAt: user.createdAt,
    }).catch((e) => {
      console.error("[auth/register] Email send threw unexpectedly:", e);
      return { success: false, error: e.message };
    });

    return res.status(201).json({
      message: "Registration successful",
      user: toPublicUser(user),
      token: tokenFor(user.id),
      email: emailResult,
    });
  } catch (err) {
    console.error("❌ Registration error:", err?.stack || err);
    if (err?.name === "ValidationError") {
      const msg = Object.values(err.errors || {})
        .map((e) => e.message)
        .join("; ");
      return res.status(400).json({ error: msg || "Validation failed" });
    }
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

// ─── POST /api/auth/login — verify email + password ──────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    let user = null;
    if (isDBConnected()) {
      user = await User.findOne({ email: String(email).trim().toLowerCase() });
    } else {
      user = memoryUsers.find((u) => u.email === String(email).trim().toLowerCase());
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

    return res.json({
      message: "Login successful",
      user: toPublicUser(user),
      token: tokenFor(user.id ?? user._id),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/profile — return current user (Bearer token) ──────────
router.get("/profile", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token) return res.status(401).json({ error: "Unauthorized — missing token" });

  const id = idFromToken(token);
  if (!id) return res.status(401).json({ error: "Unauthorized — invalid token" });

  try {
    let user = null;
    if (isDBConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id);
      }
    } else {
      user = memoryUsers.find((u) => String(u.id) === String(id));
    }

    if (!user) return res.status(401).json({ error: "Unauthorized — invalid token" });

    return res.json({ user: toPublicUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
