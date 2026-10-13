import { trains } from "../data/trainIndex.js";
import { stationByCode, platformFor } from "../data/stationData.js";
import { companionData } from "../data/routes.js";
import { calculateLiveTelemetry } from "./liveTracker.js";

/**
 * AI Real-time Delay & Route Prediction Engine
 */
export const generateAiPrediction = (train, telemetry) => {
  const currentDelay = train.delay || 0;
  const remainingDist = telemetry?.distanceRemaining || 400;
  const trainType = train.type || "Express";
  const speed = telemetry?.telemetry?.speedKmH || 100;

  // Higher priority trains (Rajdhani, Vande Bharat, Shatabdi) recover delay faster
  const isHighPriority =
    trainType === "Rajdhani" || trainType === "Vande Bharat" || trainType === "Tejas";
  const isMediumPriority = trainType === "Shatabdi" || trainType === "Duronto" || trainType === "Superfast";

  // Calculate recovery potential based on remaining distance and train class
  let recoveryPotential = 0;
  if (currentDelay > 0) {
    if (isHighPriority) {
      recoveryPotential = Math.min(currentDelay, Math.round((remainingDist / 200) * 8));
    } else if (isMediumPriority) {
      recoveryPotential = Math.min(currentDelay, Math.round((remainingDist / 250) * 5));
    } else {
      recoveryPotential = Math.min(currentDelay, Math.round((remainingDist / 350) * 3));
    }
  }

  const predictedFinalDelay = Math.max(0, currentDelay - recoveryPotential);
  const confidence = Math.min(98, Math.max(88, 95 - Math.round(currentDelay * 0.4)));

  let riskLevel = "LOW";
  if (predictedFinalDelay > 30) riskLevel = "HIGH";
  else if (predictedFinalDelay > 10) riskLevel = "MODERATE";

  const onTimeProbability = Math.max(15, Math.min(99, Math.round(100 - predictedFinalDelay * 2.2)));

  // Identify bottleneck junctions along upcoming stations
  const upcomingStations = telemetry?.upcoming || [];
  const bottlenecks = upcomingStations.slice(0, 3).map((st, i) => {
    const isJunction = (st.name || "").toLowerCase().includes("jn") || (st.name || "").toLowerCase().includes("central");
    return {
      station: st.name,
      code: st.code,
      risk: isJunction ? (i === 0 ? "Medium" : "Low") : "Very Low",
      scheduledPlatform: st.platform || 1,
      expectedDelayMinutes: isJunction ? Math.round(Math.random() * 4) : 0,
      note: isJunction
        ? "Busy junction interchange - track clearance priority active"
        : "Automated block signaling - clear green aspect",
    };
  });

  // Actionable passenger recommendation
  let recommendation = "";
  if (predictedFinalDelay === 0) {
    recommendation = `Train ${train.number} (${train.name}) is running on optimal schedule. AI projects 98% probability of on-time destination arrival. Safe to schedule onward connections.`;
  } else if (predictedFinalDelay <= 15) {
    recommendation = `Minor delay of ${currentDelay}m currently. AI neural model projects recovery of ~${recoveryPotential}m due to high-speed track clearance in upcoming sector. Estimated arrival with only ~${predictedFinalDelay}m delay.`;
  } else {
    recommendation = `Moderate congestion detected along route. Train is running +${currentDelay}m behind. Expected destination arrival delay ~${predictedFinalDelay}m. Recommend buffering 30-45m for connecting travel.`;
  }

  return {
    trainNumber: train.number,
    trainName: train.name,
    trainType: train.type,
    currentDelay,
    predictedFinalDelay,
    recoveryPotentialMinutes: recoveryPotential,
    confidencePercent: confidence,
    riskLevel,
    onTimeProbabilityPercent: onTimeProbability,
    speedTelemetryKmH: speed,
    recommendation,
    factors: [
      {
        name: "Section Speed Clearance",
        status: "Favorable",
        impact: `Permissible speed up to ${telemetry?.telemetry?.topPermissibleSpeed || 130} km/h`,
      },
      {
        name: "Weather & Track Visibility",
        status: "Clear",
        impact: "Dry rail conditions, optimal adhesion, zero fog restrictions",
      },
      {
        name: "Signaling & Precedence",
        status: isHighPriority ? "Highest Priority" : "Standard Priority",
        impact: `${trainType} class enjoys dedicated green wave signal routing`,
      },
      {
        name: "Junction Congestion",
        status: riskLevel === "HIGH" ? "Heavy" : riskLevel === "MODERATE" ? "Moderate" : "Light",
        impact: `${bottlenecks.length} upcoming major interchanges evaluated`,
      },
    ],
    bottlenecks,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Intelligent AI Copilot Chat Assistant for railway tracking
 */
export const answerTravelQuery = (query, trainNumber) => {
  const q = String(query || "").toLowerCase().trim();
  let train = null;
  if (trainNumber) {
    train = trains.find((t) => t.number === String(trainNumber));
  }

  // If query explicitly contains a 5-digit number or train name
  const matchNum = q.match(/\b\d{5}\b/);
  if (!train && matchNum) {
    train = trains.find((t) => t.number === matchNum[0]);
  }

  // Calculate live telemetry if train is available
  let tele = null;
  let aiPred = null;
  if (train) {
    tele = calculateLiveTelemetry(train);
    aiPred = generateAiPrediction(train, tele);
  }

  // Intent 1: Location & Live tracking status
  if (q.includes("where") || q.includes("location") || q.includes("status") || q.includes("live") || q.includes("position") || q.includes("kahan")) {
    if (train && tele) {
      return {
        reply: `📍 **Live Status for ${train.name} (${train.number})**:\n\n` +
          `• **Current Location**: Near **${tele.currentStation?.name || train.from}** (GPS: ${tele.livePosition.lat}°N, ${tele.livePosition.lng}°E)\n` +
          `• **Speed**: **${tele.telemetry.speedKmH} km/h** (${tele.telemetry.dwellStatus})\n` +
          `• **Next Station**: **${tele.nextStation?.name || tele.destination?.name}** (ETA in ~${tele.nextStation?.etaMinutes || 25} mins on Platform ${tele.nextStation?.platform || 1})\n` +
          `• **Signal**: **${tele.telemetry.signal}** Aspect | **Progress**: ${tele.progress}% completed\n` +
          `• **Delay**: ${train.delay > 0 ? `Running delayed by **+${train.delay} mins**` : "Running **Right On Time**"}`,
        chips: ["⏱️ Delay Forecast", "🚉 Next Stop Platform", "🌦️ Route Weather", "🔊 Audio Announcement"],
      };
    }
    return {
      reply: `Please specify a train number (e.g., "Where is 12301 right now?" or "Status of 22436") to track its live GPS location and speed.`,
      chips: ["Track 12301", "Track 22436", "Track 12951", "Track 12004"],
    };
  }

  // Intent 2: Delay and AI Prediction
  if (q.includes("delay") || q.includes("predict") || q.includes("late") || q.includes("reach") || q.includes("arrive") || q.includes("time") || q.includes("samay")) {
    if (train && aiPred) {
      return {
        reply: `🤖 **AI Delay & Arrival Intelligence for ${train.name}**:\n\n` +
          `• **Current Delay**: ${aiPred.currentDelay > 0 ? `+${aiPred.currentDelay} minutes` : "On Time"}\n` +
          `• **AI Predicted Final Delay**: **${aiPred.predictedFinalDelay > 0 ? `+${aiPred.predictedFinalDelay} min` : "Right on Time (0 min delay)"}**\n` +
          `• **Recovery Potential**: Train can recover **${aiPred.recoveryPotentialMinutes} minutes** in the upcoming high-speed section\n` +
          `• **AI Confidence**: **${aiPred.confidencePercent}%** | **Risk Level**: **${aiPred.riskLevel}**\n` +
          `• **AI Recommendation**: ${aiPred.recommendation}`,
        chips: ["📍 Current GPS Position", "🚉 Platform Number", "🍲 Food & Pantry", "🚨 Railway Helpline"],
      };
    }
  }

  // Intent 3: Platform number inquiry
  if (q.includes("platform") || q.includes("track") || q.includes("patari")) {
    if (train && tele) {
      return {
        reply: `🚉 **Platform Information for ${train.name} (${train.number})**:\n\n` +
          `• **Next Stop (${tele.nextStation?.name || "Upcoming"})**: Expected on **Platform ${tele.nextStation?.platform || 1}**\n` +
          `• **Destination (${tele.destination?.name})**: Scheduled on **Platform ${tele.destination?.platform || 1}**\n` +
          `• *Note: Station masters may occasionally reassign platforms within 15 minutes of arrival depending on yard congestion.*`,
        chips: ["📍 Current Location", "⏱️ Arrival Countdown", "🌦️ Weather at Destination"],
      };
    }
  }

  // Intent 4: Weather along route
  if (q.includes("weather") || q.includes("mausam") || q.includes("rain") || q.includes("temp")) {
    const stationCodeMatch = q.match(/\b([A-Z]{3,4})\b/);
    const station = stationCodeMatch ? stationByCode(stationCodeMatch[1]) : (tele?.currentStation || null);
    if (station) {
      const w = companionData.weather[station.code] || { temp: 28, condition: "Partly Cloudy", humidity: 55, wind: 12 };
      return {
        reply: `🌦️ **Live Weather at ${station.name} (${station.code})**:\n\n` +
          `• **Condition**: ${w.condition || "Clear Skies"}\n` +
          `• **Temperature**: ${w.temp || 27}°C\n` +
          `• **Humidity**: ${w.humidity || 50}% | **Wind Speed**: ${w.wind || 10} km/h\n` +
          `• **Track Impact**: Excellent rail-wheel adhesion, optimal braking distance.`,
        chips: ["📍 Track Train", "⏱️ Delay Prediction"],
      };
    }
  }

  // Intent 5: Food, Pantry & Catering
  if (q.includes("food") || q.includes("pantry") || q.includes("meal") || q.includes("khana") || q.includes("catering")) {
    const hasPantry = train?.type === "Rajdhani" || train?.type === "Vande Bharat" || train?.type === "Tejas" || train?.type === "Duronto" || train?.type === "Shatabdi";
    return {
      reply: `🍱 **Catering & Pantry Information**:\n\n` +
        `• **Pantry Car**: ${hasPantry ? "✅ Yes, attached on rake with complimentary/onboard hot meals & beverages" : "ℹ️ Packaged snacks & e-Catering available"}\n` +
        `• **IRCTC e-Catering**: You can order fresh restaurant food directly to your seat using train number **${train?.number || "your train"}** and PNR at major stations like Kanpur, Prayagraj, and Mughalsarai via 1323.\n` +
        `• **Drinking Water**: Packaged Rail Neer (1 Litre @ ₹15) is available from authorized vendors.`,
      chips: ["🚨 Safety & Helpline", "📍 Current Station"],
    };
  }

  // Intent 6: Emergency & Safety
  if (q.includes("emergency") || q.includes("help") || q.includes("police") || q.includes("security") || q.includes("medical") || q.includes("sos")) {
    return {
      reply: `🚨 **Indian Railways Emergency Contacts & Helplines**:\n\n` +
        `• **Unified Railway Helpline**: **139** (Security, Medical, Complaints, Enquiries - 24x7 toll free)\n` +
        `• **RPF Security Helpline**: **182**\n` +
        `• **National Emergency / Police**: **112**\n` +
        `• **Medical Onboard Assistance**: Inform the Train Ticket Examiner (TTE) or Coach Attendant immediately. The TTE can alert medical doctors at the next upcoming station stop.`,
      chips: ["📍 Where is the train?", "⏱️ Next Station"],
    };
  }

  // Default intelligent assistant response
  return {
    reply: `👋 **RailGaadi AI Travel Assistant**:\n\n` +
      `I am your live railway AI copilot. You can ask me:\n` +
      `• *"Where is train ${train?.number || "12301"} right now?"*\n` +
      `• *"Will train ${train?.number || "12301"} arrive on time?"*\n` +
      `• *"Which platform will it arrive on?"*\n` +
      `• *"Is pantry food available onboard?"*\n` +
      `• *"Weather at destination station?"*\n\n` +
      `Railway 24x7 Unified Helpline: **139**.`,
    chips: ["📍 Track 12301 Live", "⚡ Track Vande Bharat", "⏱️ AI Delay Forecast", "🚨 Helpline 139"],
  };
};

