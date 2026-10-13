import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";

import trainRoutes from "./routes/trainRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import companionRoutes from "./routes/companionRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import trainApiRoutes from "./routes/trainApiRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import stationsRoutes from "./routes/stationsRoutes.js";
import { isTwilioConfigured } from "./utils/twilioVerify.js";

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  ...(process.env.CORS_ORIGINS || "").split(","),
  process.env.FRONTEND_URL || "",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
].map((origin) => origin.trim()).filter(Boolean);
const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);

if (Number.isInteger(trustedProxyHops) && trustedProxyHops > 0) {
  app.set("trust proxy", trustedProxyHops);
}

connectDB();

app.use(cors({
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS."));
  },
}));
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RailGaadi API",
    time: new Date().toISOString()
  });
});

app.use("/api/trains", trainRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/companion", companionRoutes);
app.use("/api/map", mapRoutes);

app.use("/api/train", trainApiRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stations", stationsRoutes);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>RailGaadi API Server</title>
      </head>
      <body>
        <h1>🚂 RailGaadi API Server</h1>
        <p>Server is running successfully.</p>
      </body>
    </html>
  `);
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Unhandled server error:", err?.stack || err);

  const status = err?.status || err?.statusCode || 500;

  res.status(status).json({
    error: err?.message || "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`🚂 RailGaadi API running on http://localhost:${PORT}`);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("Authentication configuration error: set JWT_SECRET to a random value of at least 32 characters.");
  }
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not configured; user accounts will use temporary in-memory storage.");
  }
  if (!isTwilioConfigured()) {
    console.error("Twilio Verify is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID before enabling phone sign-in.");
  }
});