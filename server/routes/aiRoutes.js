import { Router } from "express";
import { trains, findTrain } from "../data/trainIndex.js";
import { stationByCode } from "../data/stationData.js";
import { companionData } from "../data/routes.js";

const router = Router();

// POST /api/ai/assistant — smart travel assistant (rule-based demo)
router.post("/assistant", (req, res) => {
  const { query, trainNumber } = req.body || {};
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: "query is required" });
  }

  const q = String(query).toLowerCase();
  const train = trainNumber ? trains.find((t) => t.number === trainNumber) : null;
  let answer = "";

  if (q.includes("status") || q.includes("live") || q.includes("running")) {
    if (train) {
      answer = `${train.name} (${train.number}) is currently ${train.status.toLowerCase()}${
        train.delay > 0 ? ` by ${train.delay} minutes` : ""
      }. It runs from ${stationByCode(train.from)?.name || train.from} to ${
        stationByCode(train.to)?.name || train.to
      }.`;
    } else {
      answer =
        "Please provide a train number to check live status, for example: 'What is the status of train 12301?'";
    }
  } else if (q.includes("weather")) {
    const stationMatch = q.match(/\b([A-Z]{3,4})\b/);
    if (stationMatch) {
      const s = stationByCode(stationMatch[1]);
      if (s) {
        const w = companionData.weather[s.code] || {};
        answer = `The current weather at ${s.name} is ${w.condition || "clear"} with a temperature of ${
          w.temp || 27
        }°C, humidity ${w.humidity || 60}%, and wind speed of ${w.wind || 10} km/h.`;
      }
    }
    if (!answer) {
      answer =
        "The weather across the route is mostly clear with warm temperatures. For a specific station, mention a station code (e.g., weather at NDLS).";
    }
  } else if (q.includes("search") || q.includes("find")) {
    const term = q
      .replace("search", "")
      .replace("find", "")
      .replace("trains", "")
      .replace("train", "")
      .trim();
    const results = findTrain(term || "express");
    if (results.length) {
      answer = `I found ${results.length} train(s). Top matches: ${results
        .slice(0, 3)
        .map((t) => `${t.name} (${t.number})`)
        .join(", ")}.`;
    } else {
      answer = `I couldn't find any train matching "${term}". Try searching by name, number, or type (e.g., Rajdhani).`;
    }
  } else if (q.includes("help") || q.includes("hello") || q.includes("hi")) {
    answer = `I'm your RailGaadi travel assistant! You can ask about train status (e.g., "status of 12301"), weather at stations (e.g., "weather at NDLS"), or search trains (e.g., "search Rajdhani"). Emergency helplines: ${companionData.safety.helpline} (railway), ${companionData.emergency.police} (police).`;
  } else {
    answer = `I found "${query}" in the RailGaadi knowledge base. Try asking about live train status, station weather, or train search. Railway helpline: ${companionData.safety.helpline}.`;
  }

  res.json({
    query,
    trainNumber: train?.number || null,
    reply: answer,
    timestamp: new Date().toISOString(),
  });
});

export default router;

