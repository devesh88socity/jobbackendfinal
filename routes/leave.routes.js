const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leave.controller");
const authenticate = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

// Middleware: All routes require authentication
router.use(authenticate);

/* =========================================================================
 * Routes for EMPLOYEES & MANAGERS (Self-service)
 * ========================================================================= */

/**
 * @route   POST /leaves/apply
 * @desc    Apply for leave (Employee or Manager)
 * @roles   Employee, Manager
 */
router.post(
  "/apply",
  allowRoles("Employee", "Manager"),
  leaveController.applyLeave
);

/**
 * @route   POST /leaves/manager/apply
 * @desc    Apply for leave (Manager to Admin)
 * @roles   Manager
 */
router.post(
  "/manager/apply",
  allowRoles("Manager"),
  leaveController.managerApplyLeave
);

/**
 * @route   GET /leaves/my
 * @desc    Get logged-in user's own leave requests
 * @roles   Employee, Manager
 */
router.get(
  "/my",
  allowRoles("Employee", "Manager"),
  leaveController.getMyLeaves
);

/**
 * @route   PATCH /leaves/:id/cancel
 * @desc    Cancel a pending leave request
 * @roles   Employee, Manager
 */
router.patch(
  "/:id/cancel",
  allowRoles("Employee", "Manager"),
  leaveController.cancelLeave
);

/* =========================================================================
 * Routes for MANAGERS & ADMINS (Team management)
 * ========================================================================= */

/**
 * @route   GET /leaves/team/managers
 * @desc    Get leave requests submitted by Managers to this manager/admin
 * @roles   Manager, Admin
 */
router.get(
  "/team/managers",
  allowRoles("Manager", "Admin"),
  leaveController.getManagerLeaves
);

/**
 * @route   GET /leaves/team/employees
 * @desc    Get leave requests submitted by Employees to this manager/admin
 * @roles   Manager, Admin
 */
router.get(
  "/team/employees",
  allowRoles("Manager", "Admin"),
  leaveController.getEmployeeLeaves
);

/**
 * @route   PATCH /leaves/:id/status
 * @desc    Approve/Reject a leave request
 * @roles   Manager, Admin
 */
router.patch(
  "/:id/status",
  allowRoles("Manager", "Admin"),
  leaveController.updateLeaveStatus
);

/* =========================================================================
 * Routes for ADMINS (Company-wide view)
 * ========================================================================= */

/**
 * @route   GET /leaves
 * @desc    Get all leaves filtered by month and year
 * @roles   Admin
 * @query   ?month=&year=
 */
router.get("/", allowRoles("Admin"), leaveController.getAllLeavesByMonth);

/**
 * @route   GET /leaves/:employeeId
 * @desc    Get leaves by specific employee ID
 * @roles   Admin
 */
router.get(
  "/:employeeId",
  allowRoles("Admin"),
  leaveController.getLeavesByEmployee
);

module.exports = router;
