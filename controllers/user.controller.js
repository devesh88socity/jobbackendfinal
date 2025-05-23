const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Get logged-in user's profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Update user role
exports.updateUserRole = async (req, res) => {
  try {
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

    // // Generate a new token for the updated user
    // const token = jwt.sign(
    //   {
    //     id: user._id,
    //     email: user.email,
    //     role: user.role,
    //   },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1d" }
    // );

    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Assign employee to manager's team
exports.assignTeamMember = async (req, res) => {
  try {
    console.log("hello");
    const { managerId, employeeIds } = req.body;
    console.log(employeeIds);
    const employeeId = employeeIds[0];

    console.log(managerId, employeeId);
    const [manager, employee] = await Promise.all([
      User.findById(managerId),
      User.findById(employeeId),
    ]);

    if (!manager || manager.role !== "Manager") {
      return res
        .status(400)
        .json({ message: "Manager not found or invalid role" });
    }

    if (!employee || employee.role !== "Employee") {
      return res
        .status(400)
        .json({ message: "Employee not found or invalid role" });
    }

    if (manager.team.includes(employeeId)) {
      return res.status(409).json({ message: "Employee already in team" });
    }

    manager.team.push(employeeId);
    await manager.save();

    res.json({ message: "Employee assigned to manager", manager });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Unassign employee from manager's team
exports.unassignTeamMember = async (req, res) => {
  try {
    const { managerId, employeeIds } = req.body;
    const employeeId = employeeIds[0];

    const [manager, employee] = await Promise.all([
      User.findById(managerId),
      User.findById(employeeId),
    ]);

    if (!manager || manager.role !== "Manager") {
      return res
        .status(400)
        .json({ message: "Manager not found or invalid role" });
    }

    if (!employee || employee.role !== "Employee") {
      return res
        .status(400)
        .json({ message: "Employee not found or invalid role" });
    }

    if (!manager.team.includes(employeeId)) {
      return res.status(409).json({ message: "Employee not in the team" });
    }

    // Remove employeeId from manager.team array
    manager.team = manager.team.filter(
      (id) => id.toString() !== employeeId.toString()
    );

    await manager.save();

    res.json({ message: "Employee unassigned from manager", manager });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Update leave balance for any user
exports.updateLeaveBalance = async (req, res) => {
  try {
    const userId = req.params.id;
    const { leaves } = req.body;

    if (leaves == null || isNaN(leaves)) {
      return res.status(400).json({ message: "Valid leave count is required" });
    }

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.leaves = leaves;
    await user.save();

    res.json({
      message: `Leave balance updated to ${leaves} for ${user.name}`,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        leaves: user.leaves,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Update user details (role and/or leave balance)
exports.updateUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role, leaves } = req.body;

    const updateFields = {};

    // Validate and set role if provided
    if (role) {
      const validRoles = ["Employee", "Manager", "Admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updateFields.role = role;
    }

    // Validate and set leave balance if provided
    if (leaves != null) {
      if (isNaN(leaves)) {
        return res
          .status(400)
          .json({ message: "Leave balance must be a number" });
      }
      updateFields.leaves = leaves;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "User details updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        leaves: user.leaves,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Show all teams with manager and their team members
exports.getAllTeams = async (req, res) => {
  try {
    // Find all managers
    const managers = await User.find({ role: "Manager" }).populate({
      path: "team",
      select: "name email", // Select fields to return for team members
    });

    const teams = managers.map((manager) => ({
      managerName: manager.name,
      managerEmail: manager.email,
      teamMembers: manager.team.map((member) => ({
        name: member.name,
        email: member.email,
      })),
    }));

    res.json({ teams });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
