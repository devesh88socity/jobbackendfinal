// controllers/user.controller.js
const User = require("../models/user.model");

exports.getMyProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

exports.getAllUsers = async (req, res) => {
  console.log("working");
  const users = await User.find().select("-password");
  res.json(users);
};

exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const allowedRoles = ["Employee", "Manager", "Admin"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ message: `Role updated to ${role}`, user });
};
