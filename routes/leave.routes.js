//routes/leave.routes.js
const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leave.controller");
const authenticate = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /leaves/apply
 * @desc    Apply for leave (Employee or Manager)
 */
router.post(
  "/apply",
  allowRoles("Employee", "Manager"),
  leaveController.applyLeave
);

/**
 * @route   GET /leaves/my
 * @desc    Get logged-in user's leave requests
 */
router.get(
  "/my",
  allowRoles("Employee", "Manager"),
  leaveController.getMyLeaves
);

/**
 * @route   GET /leaves/team
 * @desc    Get leave requests submitted to this manager/admin
 */
router.get(
  "/team",
  allowRoles("Manager", "Admin"),
  leaveController.getTeamLeaves
);

/**
 * @route   PATCH /leaves/:id/status
 * @desc    Approve/Reject a leave request
 */
router.patch(
  "/:id/status",
  allowRoles("Manager", "Admin"),
  leaveController.updateLeaveStatus
);

module.exports = router;
