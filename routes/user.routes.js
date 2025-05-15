// routes/user.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

router.use(authenticate);

router.get("/me", userController.getMyProfile);
router.get("/", allowRoles("Admin"), userController.getAllUsers);
router.get("/:id", allowRoles("Admin"), userController.getUserById);
router.patch("/:id/role", allowRoles("Admin"), userController.updateUserRole);

module.exports = router;
