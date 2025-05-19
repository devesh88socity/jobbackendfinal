// models/user.model.js
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
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
