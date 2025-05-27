//controllers/leave.controller.js
const mongoose = require("mongoose");
const Leave = require("../models/leave.model");
const User = require("../models/user.model");

// Employee: Apply for leave
exports.applyLeave = async (req, res) => {
  const {
    startDate,
    endDate,
    reason,
    leaveType = "Casual",
    isHalfDay = false,
  } = req.body;

  if (!startDate || !endDate || !reason) {
    return res
      .status(400)
      .json({ message: "Start date, end date, and reason are required" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return res
      .status(400)
      .json({ message: "End date cannot be before start date" });
  }

  const days = isHalfDay ? 0.5 : (end - start) / (1000 * 60 * 60 * 24) + 1;

  const employee = await User.findById(req.user.id);
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const manager = await User.findOne({
    role: "Manager",
    team: req.user.id,
  });

  if (!manager) {
    return res.status(404).json({ message: "No manager assigned" });
  }

  const leave = new Leave({
    user: req.user.id,
    startDate: start,
    endDate: end,
    reason,
    leaveType,
    isHalfDay,
    days,
    requestedTo: manager._id,
    leaveBalanceAtRequest: employee.leaves,
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
  const { status, managerRemarks } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const leave = await Leave.findById(id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });
  if (leave.status !== "Pending") {
    return res.status(400).json({ message: "Leave already processed" });
  }

  leave.status = status;
  if (managerRemarks) {
    leave.managerRemarks = managerRemarks;
  }

  await leave.save();

  // Optional: Deduct leaves if approved
  if (status === "Approved") {
    const user = await User.findById(leave.user);
    if (user) {
      user.leaves = Math.max(0, user.leaves - leave.days);
      await user.save();
    }
  }

  res.json({ message: `Leave ${status.toLowerCase()}`, leave });
};

// Cancel leave (by employee before approval)
exports.cancelLeave = async (req, res) => {
  const { id } = req.params;

  const leave = await Leave.findOne({ _id: id, user: req.user.id });

  if (!leave) return res.status(404).json({ message: "Leave not found" });
  if (leave.status !== "Pending") {
    return res
      .status(400)
      .json({ message: "Only pending leaves can be cancelled" });
  }

  leave.isCancelled = true;
  leave.status = "Rejected";
  leave.managerRemarks = "Cancelled by employee";
  await leave.save();

  res.json({ message: "Leave cancelled", leave });
};

exports.getLeavesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find all leaves where user matches employeeId and is not cancelled
    const leaves = await Leave.find({ user: employeeId, isCancelled: false })
      .sort({ startDate: -1 }) // optional: sort latest first
      .select(
        "_id startDate endDate status reason leaveType days isHalfDay managerRemarks"
      );

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaves", error });
  }
};
