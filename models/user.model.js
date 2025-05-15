// models/user.model.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  googleId: String,
  role: {
    type: String,
    enum: ["Employee", "Manager", "Admin"],
    default: "Employee",
  },
  leaves: { type: Number, default: 0 },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // for managers
});

module.exports = mongoose.model("User", userSchema);
