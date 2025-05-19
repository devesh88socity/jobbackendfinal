//controllers/leave.controller.js
const mongoose = require("mongoose");
const Leave = require("../models/leave.model");
const User = require("../models/user.model");

// Employee: Apply for leave
exports.applyLeave = async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start and end date are required" });
  }

  if (new Date(endDate) < new Date(startDate)) {
    return res
      .status(400)
      .json({ message: "End date cannot be before start date" });
  }

  const manager = await User.findOne({
    role: "Manager",
    team: req.user.id, // Let Mongoose handle casting
  });

  if (!manager) {
    return res.status(404).json({ message: "No manager assigned" });
  }

  const leave = new Leave({
    user: req.user.id,
    startDate,
    endDate,
    requestedTo: manager._id,
  });

  await leave.save();

  res.status(201).json({ message: "Leave request submitted", leave });
};

// Get logged-in user's leave requests
exports.getMyLeaves = async (req, res) => {
  const leaves = await Leave.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.json(leaves);
};

// Manager/Admin: Get team members' leave requests
exports.getTeamLeaves = async (req, res) => {
  const leaves = await Leave.find({ requestedTo: req.user.id })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(leaves);
};

// Manager/Admin: Update leave status
exports.updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const leave = await Leave.findById(id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });

  leave.status = status;
  await leave.save();

  res.json({ message: `Leave ${status.toLowerCase()}`, leave });
};
