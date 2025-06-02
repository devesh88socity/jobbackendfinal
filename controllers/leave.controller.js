//controllers/leave.controller.js
const mongoose = require("mongoose");
const Leave = require("../models/leave.model");
const User = require("../models/user.model");
const sendLeaveRequestEmail = require("../utils/sendLeaveRequestEmail"); // adjust path as needed
const sendLeaveStatusEmail = require("../utils/sendLeaveStatusEmail");
const sendManagerLeaveRequestEmail = require("../utils/sendManagerLeaveRequestEmail");

// Employee: Can apply for leave/work from home
exports.applyLeave = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reason,
      leaveType = "Casual",
      isHalfDay = false,
      isWFH = false,
    } = req.body;

    // Basic validation
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        message: "Start date, end date, and reason are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (end < start) {
      return res
        .status(400)
        .json({ message: "End date cannot be before start date" });
    }

    // Validate WFH logic
    if (isWFH && leaveType !== "WorkFromHome") {
      return res.status(400).json({
        message: "Leave type must be 'WorkFromHome' if isWFH is true",
      });
    }

    if (leaveType === "WorkFromHome" && !isWFH) {
      return res.status(400).json({
        message: "isWFH must be true if leaveType is 'WorkFromHome'",
      });
    }

    // Calculate number of leave days
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const days = isHalfDay
      ? 0.5
      : Math.floor((end - start) / millisecondsPerDay) + 1;

    // Fetch employee from DB
    const employee = await User.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Find manager of this employee (who has this employee in their team)
    const manager = await User.findOne({
      team: req.user.id,
      role: "Manager",
    });

    if (!manager) {
      return res.status(404).json({
        message: "No manager found for this employee",
      });
    }

    // Find all admins
    const admins = await User.find({ role: "Admin" });
    if (!admins.length) {
      return res.status(404).json({ message: "No admins found" });
    }

    // Prepare requestedTo list (manager + admins)
    const requestedToArray = [manager._id, ...admins.map((admin) => admin._id)];

    // Create leave document
    const leave = new Leave({
      user: req.user.id,
      startDate: start,
      endDate: end,
      reason,
      leaveType,
      isWFH,
      isHalfDay,
      days,
      requestedTo: requestedToArray,
      leaveBalanceAtRequest: employee.leaves ?? 0,
      status: "Pending",
    });

    await leave.save();

    // Send email notifications (optional)
    try {
      const emailList = [manager.email, ...admins.map((admin) => admin.email)];
      await sendLeaveRequestEmail(
        emailList,
        employee.name,
        startDate,
        endDate,
        reason,
        leaveType
      );
    } catch (emailErr) {
      console.error("Failed to send leave request email:", emailErr.message);
    }

    res.status(201).json({ message: "Leave request submitted", leave });
  } catch (error) {
    console.error("Error in applyLeave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get logged-in user's leave requests
exports.getMyLeaves = async (req, res) => {
  const leaves = await Leave.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.json(leaves);
};

//Manager/Admin can see their  emmployess/manager leaves
exports.getTeamLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      requestedTo: req.user.id, // MongoDB will match if req.user.id is in the array
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("getTeamLeaves error:", error);
    res.status(500).json({ message: "Server error" });
  }
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

  // Add remarks
  if (req.user.role === "Manager" && managerRemarks) {
    leave.managerRemarks = managerRemarks;
  } else if (req.user.role === "Admin" && adminRemarks) {
    leave.adminRemarks = adminRemarks;
  }

  await leave.save();

  const approver = await User.findById(req.user.id);

  if (status === "Approved") {
    const user = await User.findById(leave.user);
    if (user) {
      if (leave.leaveType === "WorkFromHome") {
        user.wfh = Math.max(0, user.wfh - leave.days);
      } else {
        user.leaves = Math.max(0, user.leaves - leave.days);
      }
      await user.save();

      try {
        await sendLeaveStatusEmail(
          user.email,
          user.name,
          leave.startDate,
          leave.endDate,
          leave.reason,
          status,
          approver?.name || req.user.role
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
  try {
    const {
      startDate,
      endDate,
      reason,
      leaveType = "Casual",
      isHalfDay = false,
    } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        message: "Start date, end date, and reason are required",
      });
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
    if (!manager || manager.role !== "Manager") {
      return res
        .status(403)
        .json({ message: "Only managers can request here" });
    }

    // 📧 Admin email array
    const adminEmails = [
      "rakhejadevesh3@gmail.com",
      "anotheradmin@example.com",
    ];

    const admins = await User.find({
      email: { $in: adminEmails },
      role: "Admin",
    });

    if (!admins.length) {
      return res
        .status(404)
        .json({ message: "No admins found with those emails" });
    }

    const leave = new Leave({
      user: manager._id,
      startDate: start,
      endDate: end,
      reason,
      leaveType,
      isHalfDay,
      days,
      requestedTo: admins.map((admin) => admin._id), // array of admin ObjectIds
      leaveBalanceAtRequest: manager.leaves,
    });

    await leave.save();

    // 📤 Send email to all admins
    await sendManagerLeaveRequestEmail(
      adminEmails,
      manager.name,
      start,
      end,
      reason
    );

    res.status(201).json({
      message: "Leave request submitted to admin(s)",
      leave,
    });
  } catch (error) {
    console.error("managerApplyLeave error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Manager/Admin: Get leaves requested by Managers assigned to the logged-in user
exports.getManagerLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      requestedTo: req.user.id,
    })
      .populate({
        path: "user",
        select: "name email role",
        match: { role: "Manager" }, // only include if user.role is Manager
      })
      .sort({ createdAt: -1 });

    // Filter out leaves where populate didn't find a matching user (role not Manager)
    const filteredLeaves = leaves.filter((leave) => leave.user !== null);

    res.json(filteredLeaves);
  } catch (error) {
    console.error("getManagerLeaves error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Manager/Admin: Get leaves requested by Employees assigned to the logged-in user
exports.getEmployeeLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      requestedTo: req.user.id,
    })
      .populate({
        path: "user",
        select: "name email role",
        match: { role: "Employee" }, // only include if user.role is Employee
      })
      .sort({ createdAt: -1 });

    // Filter out leaves where populate didn't find a matching user (role not Employee)
    const filteredLeaves = leaves.filter((leave) => leave.user !== null);

    res.json(filteredLeaves);
  } catch (error) {
    console.error("getEmployeeLeaves error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
