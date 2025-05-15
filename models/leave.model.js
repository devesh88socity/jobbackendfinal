// models/leave.model.js
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  requestedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // manager/admin
});

module.exports = mongoose.model("Leave", leaveSchema);
