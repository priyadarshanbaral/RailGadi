import mongoose from "mongoose";
import { isDBConnected } from "../config/db.js";

// ────────────────────────────────────────────────────────────────────────────
// RailGaadi — Unique User ID Generator
//
// Generates sequential, unique User IDs in the format:
//     RG10001, RG10002, RG10003, ...
//
// When MongoDB is connected, the next ID is derived from the highest existing
// `userId` in the users collection. When using the in-memory fallback, the
// caller passes the number of existing in-memory users.
// ────────────────────────────────────────────────────────────────────────────

const PREFIX = "RG";
const START = 10001;

/**
 * Compute the next sequential User ID.
 * @param {number} fallbackCount - count of existing in-memory users (used only when DB is down)
 * @returns {Promise<string>} e.g. "RG10001"
 */
export const generateUserId = async (fallbackCount = 0) => {
  if (isDBConnected()) {
    try {
      // Find the highest numeric part of an existing RGxxxxx userId.
      const highest = await mongoose.connection.db
        .collection("users")
        .find({ userId: { $regex: `^${PREFIX}\\d+$` } })
        .project({ userId: 1, _id: 0 })
        .toArray();

      let max = START;
      for (const doc of highest) {
        const num = parseInt(String(doc.userId).slice(PREFIX.length), 10);
        if (!Number.isNaN(num) && num >= max) max = num + 1;
      }
      return `${PREFIX}${max}`;
    } catch (err) {
      console.warn("[userId] DB query failed, using count fallback:", err.message);
      return `${PREFIX}${START + fallbackCount}`;
    }
  }

  // In-memory fallback: attribute a sequential id based on count.
  return `${PREFIX}${START + fallbackCount}`;
};
