import { Router } from "express";
import { trains } from "../data/trainIndex.js";
import { calculateLiveTelemetry } from "../utils/liveTracker.js";
import { generateAiPrediction, answerTravelQuery } from "../utils/aiPrediction.js";

const router = Router();

// GET /api/ai/prediction/:trainNumber — real-time AI delay & risk prediction
router.get("/prediction/:trainNumber", (req, res) => {
  const train = trains.find((t) => t.number === req.params.trainNumber);
  if (!train) return res.status(404).json({ error: "Train not found" });

  const simSpeed = parseFloat(req.query.simSpeed) || 1;
  const telemetry = calculateLiveTelemetry(train, { simSpeed });
  const prediction = generateAiPrediction(train, telemetry);

  res.json(prediction);
});

// POST /api/ai/assistant — smart travel copilot assistant
router.post("/assistant", (req, res) => {
  const { query, trainNumber } = req.body || {};
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: "query is required" });
  }

  const { reply, chips } = answerTravelQuery(query, trainNumber);

  res.json({
    query,
    trainNumber: trainNumber || null,
    reply,
    chips: chips || [],
    timestamp: new Date().toISOString(),
  });
});

export default router;
