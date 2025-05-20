//routes/auth.routes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const authenticate = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller");

// ==============================
// Google OAuth Routes
// ==============================

/**
 * @route   GET /auth/google
 * @desc    Redirect user to Google for authentication
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @route   GET /auth/google/callback
 * @desc    Handle Google OAuth callback and return JWT
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const { token, user } = req.user;

    // Send token to frontend (cookie or JSON)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production", // Only secure in production
    });

    // Determine redirect URL based on user role
    let redirectPath = "/unauthorized";
    if (user.role === "Admin") {
      redirectPath = "/admin/dashboard";
    } else if (user.role === "Manager") {
      redirectPath = "/manager/dashboard";
    } else if (user.role === "Employee") {
      redirectPath = "/employee/dashboard";
    }

    // Redirect to frontend URL with path
    res.redirect(`${process.env.FRONTEND_URL}${redirectPath}`);
    // res.status(200).json({ token, user });
  }
);

// ==============================
// Refresh Token
// ==============================

/**
 * @route   GET /auth/refresh
 * @desc    Get a fresh token if user role or permissions have changed
 */
router.get("/refresh", authenticate, authController.refreshToken);

module.exports = router;
