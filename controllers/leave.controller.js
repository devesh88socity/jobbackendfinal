// controllers/leave.controller.js
const Leave = require("../models/leave.model");
const User = require("../models/user.model");

exports.applyLeave = async (req, res) => {
  const { startDate, endDate } = req.body;

  const manager = await User.findOne({ role: "Manager", team: req.user.id });

  const leave = new Leave({
    user: req.user.id,
    startDate,
    endDate,
    requestedTo: manager?._id,
  });

  await leave.save();
  res.status(201).json({ message: "Leave request submitted", leave });
};

exports.getMyLeaves = async (req, res) => {
  const leaves = await Leave.find({ user: req.user.id });
  res.json(leaves);
};

exports.getTeamLeaves = async (req, res) => {
  const leaves = await Leave.find({ requestedTo: req.user.id }).populate(
    "user"
  );
  res.json(leaves);
};

exports.updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const leave = await Leave.findById(id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });

  leave.status = status;
  await leave.save();

  res.json({ message: `Leave ${status}` });
};
