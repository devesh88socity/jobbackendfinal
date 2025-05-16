const User = require("../models/user.model");

// Get logged-in user's profile
exports.getMyProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// Admin: Get user by ID
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// Admin: Update user role
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const validRoles = ["Employee", "Manager", "Admin"];

  if (!validRoles.includes(role)) {
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

// Admin: Assign employee to manager's team
exports.assignTeamMember = async (req, res) => {
  const { managerId, employeeId } = req.body;

  const manager = await User.findById(managerId);
  const employee = await User.findById(employeeId);

  if (!manager || manager.role !== "Manager") {
    return res.status(400).json({ message: "Invalid manager" });
  }

  if (!employee || employee.role !== "Employee") {
    return res.status(400).json({ message: "Invalid employee" });
  }

  if (manager.team.includes(employeeId)) {
    return res.status(409).json({ message: "Employee already in team" });
  }

  manager.team.push(employeeId);
  await manager.save();

  res.json({ message: "Employee assigned to manager", manager });
};

// Admin: Update leave balance
exports.updateLeaves = async (req, res) => {
  const { id } = req.params;
  const { leaves } = req.body;

  if (leaves == null || isNaN(leaves)) {
    return res.status(400).json({ message: "Valid leave count is required" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.leaves = leaves;
  await user.save();

  res.json({ message: "Leave balance updated", user });
};
