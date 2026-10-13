import mongoose from "mongoose";

// MongoDB connection with graceful in-memory fallback.
// Only the USER data is stored in MongoDB (per requirements).
// If MongoDB is not running, the server still works with in-memory user storage.
const DEFAULT_URI = "mongodb://127.0.0.1:27017/railgaadi";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`🍃 MongoDB connected: ${uri}`);
    return true;
  } catch (err) {
    console.warn(
      "⚠️  MongoDB not available — falling back to in-memory user store. " +
        "Start MongoDB locally for persistent user data."
    );
    console.warn(`   (${err.message})`);
    return false;
  }
};

export const isDBConnected = () => mongoose.connection.readyState === 1;

