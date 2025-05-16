const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

router.use(authenticate);

// Any user can check their own profile
router.get("/me", userController.getMyProfile);

// Admin: Get all users
router.get("/", allowRoles("Admin"), userController.getAllUsers);

// Admin: Get a specific user by ID
router.get("/:id", allowRoles("Admin"), userController.getUserById);

// Admin: Update user role
router.patch("/:id/role", allowRoles("Admin"), userController.updateUserRole);

// Admin: Update leave balance for a user
router.patch("/leave/:id", allowRoles("Admin"), userController.updateLeaves);

// Admin: Assign team member to a manager
router.post(
  "/assign-team",
  allowRoles("Admin"),
  userController.assignTeamMember
);

module.exports = router;
