//controllers/leave.controller.js
const mongoose = require("mongoose");
const Leave = require("../models/leave.model");
const User = require("../models/user.model");
const sendLeaveRequestEmail = require("../utils/sendLeaveRequestEmail"); // adjust path as needed
const sendLeaveStatusEmail = require("../utils/sendLeaveStatusEmail");
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
  try {
    console.log("hi red");
    await sendLeaveRequestEmail(
      manager.email,
      employee.name,
      startDate,
      endDate,
      reason
    );
  } catch (error) {
    console.error(
      "Failed to send leave request email to manager:",
      error.message
    );
  }

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
  const { status, managerRemarks, adminRemarks } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const leave = await Leave.findById(id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });
  if (leave.status !== "Pending") {
    return res.status(400).json({ message: "Leave already processed" });
  }

  leave.status = status;

  // Assign remarks based on role
  if (req.user.role === "Manager" && managerRemarks) {
    leave.managerRemarks = managerRemarks;
  } else if (req.user.role === "Admin" && adminRemarks) {
    leave.adminRemarks = adminRemarks;
  }

  await leave.save();

  const approver = await User.findById(req.user.id);

  // Optional: Deduct leaves if approved
  if (status === "Approved") {
    const user = await User.findById(leave.user);
    if (user) {
      user.leaves = Math.max(0, user.leaves - leave.days);
      await user.save();
      try {
        await sendLeaveStatusEmail(
          user.email,
          user.name,
          leave.startDate,
          leave.endDate,
          leave.reason,
          status,
          approver?.name || "Manager"
        );
      } catch (error) {
        console.error("Failed to send approval email:", error.message);
      }
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

exports.getAllLeavesByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required." });
    }

    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    if (isNaN(parsedMonth) || isNaN(parsedYear)) {
      return res
        .status(400)
        .json({ message: "Month and year must be valid numbers." });
    }

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59);

    const leaves = await Leave.find({
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).populate("user", "name email");

    const formatted = leaves.map((leave) => ({
      employeeName: leave.user?.name || "N/A",
      email: leave.user?.email || "N/A",
      fromDate: leave.startDate.toISOString().split("T")[0],
      toDate: leave.endDate.toISOString().split("T")[0],
      status: leave.status,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("Error fetching leaves by month:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching leaves." });
  }
};

// Manager: Apply for leave (to Admin)
exports.managerApplyLeave = async (req, res) => {
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

  const manager = await User.findById(req.user.id);
  if (!manager) {
    return res.status(404).json({ message: "Manager not found" });
  }

  // Find the admin(s)
  const admin = await User.findOne({ role: "Admin" });

  if (!admin) {
    return res.status(404).json({ message: "No admin assigned" });
  }

  const leave = new Leave({
    user: req.user.id,
    startDate: start,
    endDate: end,
    reason,
    leaveType,
    isHalfDay,
    days,
    requestedTo: admin._id, // Requesting to admin
    leaveBalanceAtRequest: manager.leaves,
  });

  await leave.save();

  res.status(201).json({ message: "Leave request submitted to admin", leave });
};
