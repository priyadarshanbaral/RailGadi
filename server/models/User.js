import mongoose from "mongoose";

// User model — MongoDB stores only user data (name, email, password)
const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [4, "Password must be at least 4 characters"],
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Basic token generation (demo — base64 of user id)
userSchema.methods.generateToken = function () {
  return Buffer.from(`rg-user-${this._id}`).toString("base64");
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

