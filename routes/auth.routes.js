// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const authenticate = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller");

// Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback URL
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const { token, user } = req.user;

    // Send token to frontend (in cookie or JSON)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    });

    res.status(200).json({ token, user });
  }
);

router.get("/refresh", authenticate, authController.refreshToken);

module.exports = router;
