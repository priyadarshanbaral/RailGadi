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
import aiRoutes from "./routes/aiRoutes.js";
import stationsRoutes from "./routes/stationsRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
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
});