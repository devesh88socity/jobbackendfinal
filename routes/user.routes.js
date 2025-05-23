const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

router.use(authenticate);

/**
 * @route   GET /users/teams
 * @desc    Get all teams with manager and team member details
 * @access  Employee
 */
router.get(
  "/teams",
  allowRoles("Employee", "Manager", "Admin"), // Optional: you can limit this to Employee only
  userController.getAllTeams
);

/**
 * @route   GET /users/me
 * @desc    Get logged-in user's profile
 */
router.get("/me", userController.getMyProfile);

/**
 * @route   GET /users/
 * @desc    Get all users (Admin only)
 */
router.get("/", allowRoles("Admin"), userController.getAllUsers);

/**
 * @route   POST /users/assign-team
 * @desc    Assign team member to a manager (Admin only)
 */
router.post(
  "/assign-team",
  allowRoles("Admin"),
  userController.assignTeamMember
);

/**
 * @route   GET /users/:id
 * @desc    Get a specific user by ID (Admin only)
 */
router.get("/:id", allowRoles("Admin"), userController.getUserById);

/**
 * @route   PATCH /users/:id/role
 * @desc    Update user role (Admin only)
 */
router.patch("/:id/role", allowRoles("Admin"), userController.updateUserRole);

/**
 * @route   PUT /users/:id/leaves
 * @desc    Update leave balance (Admin only)
 */
router.put(
  "/:id/leaves",
  allowRoles("Admin"),
  userController.updateLeaveBalance
);

/**
 * @route   PATCH /users/:id
 * @desc    Update user details like role and/or leave balance (Admin only)
 */
router.patch("/:id", allowRoles("Admin"), userController.updateUserDetails);

/**
 * @route   POST /users/unassign-team
 * @desc    Unassign team member from a manager (Admin only)
 */
router.post(
  "/unassign-team",
  allowRoles("Admin"),
  userController.unassignTeamMember
);

module.exports = router;
