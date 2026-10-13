import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { isDBConnected } from "../config/db.js";
import { generateUserId } from "../utils/userId.js";
import { checkTwilioVerification, sendTwilioVerification } from "../utils/twilioVerify.js";
import { signAuthToken, verifyAuthToken } from "../utils/authToken.js";
import { hashPassword, isHashedPassword, verifyPassword } from "../utils/passwords.js";

const router = Router();

// ─── In-memory fallback user store (used when MongoDB is unavailable) ───
const memoryUsers = []; // { id, userId, name, email, phone, password, createdAt }
let memoryIdCounter = 1;

// Pending registration attempts expire after five minutes; Twilio Verify owns
// and validates the OTP so the API never stores or returns the code.
const pendingRegistrations = new Map();
const registrationRateLimits = new Map();
const verificationAttempts = new Map();
const sendRequestLimits = new Map();
const verificationRequestLimits = new Map();
const pendingSends = new Set();
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 30 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_IP = 5;
const MAX_VERIFICATIONS_PER_IP = 10;
const MAX_VERIFICATIONS_PER_PHONE = 5;

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

const consumeLimit = (limits, key, maxRequests, windowMs) => {
  const now = Date.now();
  if (limits.size > 5000) {
    for (const [entryKey, entry] of limits) {
      if (entry.resetAt <= now) limits.delete(entryKey);
    }
  }
  const current = limits.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  if (entry.count >= maxRequests) return false;
  entry.count += 1;
  limits.set(key, entry);
  return true;
};

const normalizePhoneNumber = (value) => {
  if (typeof value !== "string") return null;
  let digits = value.trim().replace(/[\s().-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^\d{10}$/.test(digits)) digits = `+91${digits}`;
  else if (/^0\d{10}$/.test(digits)) digits = `+91${digits.slice(1)}`;
  else if (/^91\d{10}$/.test(digits)) digits = `+${digits}`;
  if (!/^\+[1-9]\d{7,14}$/.test(digits)) return null;
  return digits;
};

// ─── Helpers: check if registration identifiers are already taken ────────
const isEmailTaken = async (normalizedEmail) => {
  if (isDBConnected()) {
    const existing = await User.findOne({ email: normalizedEmail });
    return !!existing;
  }
  return memoryUsers.some((u) => u.email === normalizedEmail);
};

const findUserByPhone = async (phone) => {
  if (isDBConnected()) {
    return User.findOne({ phone });
  }
  return memoryUsers.find((u) => u.phone === phone) || null;
};

export const sendOtpHandler = async (req, res) => {
  const {
    name,
    email,
    phone: submittedPhone,
    password,
    confirmPassword,
    purpose = "auth",
  } = req.body || {};
  const phone = normalizePhoneNumber(submittedPhone);
  if (!phone) {
    return res.status(400).json({
      error: "Enter a valid mobile number in international format, such as +91 98765 43210.",
    });
  }
  if (name !== undefined && (typeof name !== "string" || !name.trim() || name.trim().length > 60)) {
    return res.status(400).json({ error: "Please enter a name of 1 to 60 characters." });
  }
  if (email !== undefined && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim()))) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }
  if (password !== undefined && (typeof password !== "string" || password.length < 4)) {
    return res.status(400).json({ error: "Password must be at least 4 characters long." });
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return res.status(400).json({ error: "Passwords do not match." });
  }
  if (!["auth", "login", "password-reset"].includes(purpose)) {
    return res.status(400).json({ error: "Unsupported verification purpose." });
  }

  const now = Date.now();
  if (pendingRegistrations.size > 2000) {
    for (const [key, registration] of pendingRegistrations) {
      if (now >= registration.expiresAt) {
        pendingRegistrations.delete(key);
        verificationAttempts.delete(key);
      }
    }
  }
  if (now < (registrationRateLimits.get(phone) || 0)) {
    return res.status(429).json({ error: "Please wait before requesting another verification code." });
  }
  if (pendingSends.has(phone)) {
    return res.status(429).json({ error: "A verification request is already in progress for this number." });
  }
  const ipKey = req.ip || req.socket.remoteAddress || "unknown";
  if (!consumeLimit(sendRequestLimits, ipKey, MAX_SENDS_PER_IP, SEND_WINDOW_MS)) {
    return res.status(429).json({ error: "Too many verification requests. Please try again later." });
  }

  pendingSends.add(phone);
  try {
    await sendTwilioVerification(phone);
    registrationRateLimits.set(phone, now + OTP_RESEND_DELAY_MS);
    pendingRegistrations.set(phone, {
      expiresAt: now + OTP_TTL_MS,
      purpose,
    });
    verificationAttempts.delete(phone);
    return res.json({
      ok: true,
      message: `Verification code sent to ${phone}`,
      phone,
      expiresInSeconds: OTP_TTL_MS / 1000,
      provider: "twilio",
    });
  } catch (err) {
    console.error("[auth/send-otp] Twilio Verify request failed:", err.providerCode || err.message);
    return res.status(err.statusCode || 502).json({
      error: err.message || "We could not send a verification code. Check the Twilio Verify settings and try again.",
    });
  } finally {
    pendingSends.delete(phone);
  }
};

router.post("/send-otp", sendOtpHandler);

export const verifyOtpHandler = async (req, res) => {
  const {
    name,
    email,
    phone: submittedPhone,
    password,
    confirmPassword,
    otp,
    newPassword,
  } = req.body || {};

  const phone = normalizePhoneNumber(submittedPhone);
  if (!phone || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: "A valid mobile number and 6-digit OTP are required." });
  }

  const pending = pendingRegistrations.get(phone);
  if (!pending) {
    return res.status(400).json({
      error: "No pending verification found for this mobile number. Request a new SMS code.",
    });
  }

  // Check expiration
  if (Date.now() >= pending.expiresAt) {
    pendingRegistrations.delete(phone);
    return res.status(400).json({
      error: "This registration request expired. Request a new SMS code.",
    });
  }
  if (
    pending.purpose === "password-reset" &&
    (typeof newPassword !== "string" || newPassword.length < 4 || newPassword.length > 128)
  ) {
    return res.status(400).json({ error: "Enter a new password between 4 and 128 characters." });
  }

  const ipKey = req.ip || req.socket.remoteAddress || "unknown";
  if (!consumeLimit(verificationRequestLimits, ipKey, MAX_VERIFICATIONS_PER_IP, VERIFY_WINDOW_MS)) {
    return res.status(429).json({ error: "Too many verification attempts. Please request a new code later." });
  }
  const attempts = verificationAttempts.get(phone) || 0;
  if (attempts >= MAX_VERIFICATIONS_PER_PHONE) {
    return res.status(429).json({ error: "Too many incorrect codes. Request a new verification code." });
  }
  verificationAttempts.set(phone, attempts + 1);

  let isPhoneVerified;
  try {
    isPhoneVerified = await checkTwilioVerification(phone, otp);
  } catch (err) {
    console.error("[auth/verify-otp] Twilio Verify check failed:", err.providerCode || err.message);
    return res.status(err.statusCode || 502).json({
      error: err.message || "Could not verify the code with Twilio. Please try again.",
    });
  }
  if (!isPhoneVerified) {
    return res.status(401).json({ error: "The verification code is incorrect or expired. Request a new code and try again." });
  }

  verificationAttempts.delete(phone);

  try {
    const existingUser = await findUserByPhone(phone);
    if (existingUser) {
      if (pending.purpose === "password-reset") {
        if (isDBConnected()) {
          existingUser.password = newPassword;
          await existingUser.save();
        } else {
          existingUser.password = await hashPassword(newPassword);
        }
        pendingRegistrations.delete(phone);
        registrationRateLimits.delete(phone);
        return res.json({
          ok: true,
          message: "If this number belongs to an account, its password has been reset. You can now try logging in.",
        });
      }
      pendingRegistrations.delete(phone);
      registrationRateLimits.delete(phone);
      return res.json({
        ok: true,
        message: "Phone verified and login successful.",
        user: toPublicUser(existingUser),
        token: tokenFor(existingUser.id ?? existingUser._id),
        phoneVerified: true,
      });
    }
    if (pending.purpose === "password-reset") {
      pendingRegistrations.delete(phone);
      return res.json({
        ok: true,
        message: "If this number belongs to an account, its password has been reset. You can now try logging in.",
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 60 ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "This number is not registered. Provide name, email and password to create an account.",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || password.length < 4) {
      return res.status(400).json({ error: "Enter a valid email address and a password of at least 4 characters." });
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return res.status(400).json({ error: "Passwords do not match." });
    }
    if (await isEmailTaken(normalizedEmail)) {
      pendingRegistrations.delete(phone);
      return res.status(409).json({
        error: "We could not create an account with those details. Check the email address or sign in.",
      });
    }

    if (isDBConnected()) {
      const userId = await generateUserId();
      const user = await User.create({
        userId,
        name: name.trim(),
        email: normalizedEmail,
        phone,
        password,
      });
      pendingRegistrations.delete(phone);
      registrationRateLimits.delete(phone);

      return res.status(201).json({
        ok: true,
        message: "Account verified and registered successfully!",
        user: toPublicUser(user),
        token: user.generateToken(),
        phoneVerified: true,
      });
    }

    // In-memory fallback
    const hashedPassword = await hashPassword(password);
    if (
      memoryUsers.some((user) => user.phone === phone || user.email === normalizedEmail)
    ) {
      pendingRegistrations.delete(phone);
      return res.status(409).json({
        error: "We could not create an account with those details. Check the email address or sign in.",
      });
    }
    const userId = await generateUserId(memoryUsers.length);
    const user = {
      id: memoryIdCounter++,
      userId,
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    memoryUsers.push(user);
    pendingRegistrations.delete(phone);
    registrationRateLimits.delete(phone);

    return res.status(201).json({
      ok: true,
      message: "Account verified and registered successfully!",
      user: toPublicUser(user),
      token: tokenFor(user.id),
      phoneVerified: true,
    });
  } catch (err) {
    console.error("[auth/verify-otp] Registration failed:", err?.code || err?.name || "unknown error");
    if (err?.code === 11000) {
      pendingRegistrations.delete(phone);
      return res.status(409).json({ error: "User already registered with this email or mobile number. Please login." });
    }
    if (err?.name === "ValidationError") {
      const message = Object.values(err.errors || {}).map((field) => field.message).join("; ");
      return res.status(400).json({ error: message || "Registration details are invalid." });
    }
    return res.status(500).json({ error: "Could not complete registration due to a server error. Please try again." });
  }
};

router.post("/verify-otp", verifyOtpHandler);

// ─── 3) POST /api/auth/resend-otp — send a new Twilio verification SMS ─────
router.post("/resend-otp", async (req, res) => {
  const { phone: submittedPhone } = req.body || {};
  const phone = normalizePhoneNumber(submittedPhone);
  if (!phone) {
    return res.status(400).json({ error: "A valid mobile number is required." });
  }

  const pending = pendingRegistrations.get(phone);

  if (!pending) {
    return res.status(400).json({
      error: "No active registration found for this mobile number. Please register again.",
    });
  }

  const now = Date.now();
  if (now >= pending.expiresAt) {
    pendingRegistrations.delete(phone);
    return res.status(400).json({
      error: "This registration request expired. Please start registration again.",
    });
  }
  if (now < (registrationRateLimits.get(phone) || 0)) {
    return res.status(429).json({ error: "Please wait before requesting another verification code." });
  }
  if (pendingSends.has(phone)) {
    return res.status(429).json({ error: "A verification request is already in progress for this number." });
  }
  const ipKey = req.ip || req.socket.remoteAddress || "unknown";
  if (!consumeLimit(sendRequestLimits, ipKey, MAX_SENDS_PER_IP, SEND_WINDOW_MS)) {
    return res.status(429).json({ error: "Too many verification requests. Please try again later." });
  }

  pendingSends.add(phone);
  try {
    await sendTwilioVerification(phone);
    registrationRateLimits.set(phone, now + OTP_RESEND_DELAY_MS);
    pending.expiresAt = now + OTP_TTL_MS;
    verificationAttempts.delete(phone);

    return res.json({
      ok: true,
      message: `A new verification code was sent to ${phone}`,
      phone,
      expiresInSeconds: OTP_TTL_MS / 1000,
      provider: "twilio",
    });
  } catch (err) {
    console.error("[auth/resend-otp] Twilio Verify request failed:", err.providerCode || err.message);
    return res.status(err.statusCode || 502).json({
      error: err.message || "Could not resend the verification code. Check Twilio Verify settings and try again.",
    });
  } finally {
    pendingSends.delete(phone);
  }
});

// Direct registration is disabled so that phone verification cannot be bypassed.
router.post("/register", async (req, res) => {
  return res.status(410).json({
    error: "Phone verification is required. Start with POST /api/auth/send-otp.",
  });
});

// ─── 5) POST /api/auth/login — verify email + password ────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    if (isDBConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      if (!(await verifyPassword(password, user.password))) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      if (!isHashedPassword(user.password)) {
        user.password = password;
        await user.save();
      }

      return res.json({
        message: "Login successful",
        user: toPublicUser(user),
        token: user.generateToken(),
      });
    }

    // In-memory fallback
    const user = memoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful",
      user: toPublicUser(user),
      token: tokenFor(user.id),
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: "Login failed due to a server error. Please try again." });
  }
});

// ─── 6) GET /api/auth/profile — fetch authenticated user profile ─────────
router.get("/profile", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  const userId = idFromToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    if (isDBConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (user) {
        return res.json({ user: toPublicUser(user) });
      }
    }

    const memUser = memoryUsers.find((u) => String(u.id) === String(userId));
    if (memUser) {
      return res.json({ user: toPublicUser(memUser) });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (err) {
    return res.status(500).json({ error: "Could not load the user profile. Please try again." });
  }
});

export default router;
