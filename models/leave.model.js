// models/leave.model.js
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    leaveType: {
      type: String,
      enum: ["Sick", "Casual", "Earned", "Unpaid", "Other"],
      default: "Casual",
    },
    days: { type: Number, required: true, min: 0.5 },
    isHalfDay: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    managerRemarks: { type: String, trim: true },
    leaveBalanceAtRequest: { type: Number, min: 0 },
    isCancelled: { type: Boolean, default: false },
    requestedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
