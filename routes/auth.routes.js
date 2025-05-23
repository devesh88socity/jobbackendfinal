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
    const { accessToken, refreshToken, user } = req.user;

    // Set refreshToken as cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Set accessToken as cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // // Determine redirect path
    // let redirectPath = "/unauthorized";
    // if (user.role === "Admin") redirectPath = "/admin/dashboard";
    // else if (user.role === "Manager") redirectPath = "/manager/dashboard";
    // else if (user.role === "Employee") redirectPath = "/employee/dashboard";

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/success?accessToken=${accessToken}`
    );
  }
);

// ==============================
// Refresh Token
// ==============================

/**
 * @route   GET /auth/refresh
 * @desc    Get a fresh token if user role or permissions have changed
 */
router.get("/refresh-token", authController.refreshToken);

router.post("/logout", authController.userLogout);

module.exports = router;
