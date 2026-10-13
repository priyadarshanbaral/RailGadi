import mongoose from "mongoose";
import { signAuthToken } from "../utils/authToken.js";
import { hashPassword } from "../utils/passwords.js";

// User model — MongoDB stores account details and the verified mobile number.
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
    phone: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\+[1-9]\d{7,14}$/, "Please provide a valid mobile number"],
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

userSchema.methods.generateToken = function () {
  return signAuthToken(this._id);
};

userSchema.pre("save", async function () {
  if (
    this.isModified("password") &&
    typeof this.password === "string" &&
    !this.password.startsWith("scrypt$")
  ) {
    this.password = await hashPassword(this.password);
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
