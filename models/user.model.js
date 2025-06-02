const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["Employee", "Manager", "Admin"],
      default: "Employee",
      index: true,
    },
    leaves: { type: Number, default: 0, min: 0 },
    wfh: { type: Number, default: 2, min: 0 }, // 2 WFH per month by default
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Add this field to store Google OAuth2 refresh token
    googleRefreshToken: {
      type: String,
      required: false, // not required initially, but will be saved on login
      select: false, // optional: prevent sending this field by default in queries for security
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
