const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leave.controller");
const authenticate = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

// All routes require authentication
router.use(authenticate);

router.get("/", allowRoles("Admin"), leaveController.getAllLeavesByMonth);

/**
 * @route   POST /leaves/apply
 * @desc    Apply for leave (Employee or Manager)
 * @body    { startDate, endDate, reason, leaveType, isHalfDay }
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
 * @route   PATCH /leaves/:id/cancel
 * @desc    Cancel a pending leave request (Employee or Manager)
 */

//Admin can see the leaves of employee by its id
router.get("/:employeeId", leaveController.getLeavesByEmployee);

router.patch(
  "/:id/cancel",
  allowRoles("Employee", "Manager"),
  leaveController.cancelLeave
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
 * @body    { status, managerRemarks }
 */
router.patch(
  "/:id/status",
  allowRoles("Manager", "Admin"),
  leaveController.updateLeaveStatus
);

module.exports = router;
