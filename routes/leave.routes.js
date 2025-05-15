// routes/leave.routes.js
const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leave.controller");
const authenticate = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

router.use(authenticate);

router.post(
  "/apply",
  allowRoles("Employee", "Manager"),
  leaveController.applyLeave
);
router.get(
  "/my",
  allowRoles("Employee", "Manager"),
  leaveController.getMyLeaves
);
router.get(
  "/team",
  allowRoles("Manager", "Admin"),
  leaveController.getTeamLeaves
);
router.patch(
  "/:id/status",
  allowRoles("Manager", "Admin"),
  leaveController.updateLeaveStatus
);

module.exports = router;
