// routes/index.routes.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const leaveRoutes = require("./leave.routes");
const userRoutes = require("./user.routes");

// Mount individual route modules
router.use("/auth", authRoutes);
router.use("/leave", leaveRoutes);
router.use("/users", userRoutes);

module.exports = router;
