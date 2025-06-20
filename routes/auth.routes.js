const express = require("express");
const passport = require("passport");
const router = express.Router();
const authController = require("../controllers/auth.controller");

const isProduction = process.env.NODE_ENV === "production";

// ==============================
// Cookie Options (Use SameSite: 'None' for cross-origin cookies)
// ==============================
const accessTokenCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "None" : "Lax",
  secure: isProduction,
  maxAge: 4 * 60 * 60 * 1000, // 4 hours
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "None" : "Lax",
  secure: isProduction,
  maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
};

// ==============================
// @route   GET /auth/google
// @desc    Redirect user to Google for authentication
// ==============================
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://mail.google.com/"],
    session: false,
  })
);

// ==============================
// @route   GET /auth/google/callback
// @desc    Handle Google OAuth callback, issue tokens and redirect
// ==============================
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/failure`);
      }

      const { accessToken, refreshToken } = req.user;

      // Set secure cookies
      res.cookie("accessToken", accessToken, accessTokenCookieOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

      return res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
    } catch (err) {
      console.error("OAuth Callback Error:", err);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/failure`);
    }
  }
);

// ==============================
// @route   GET /auth/refresh-token
// @desc    Issue a new access token from refresh token
// ==============================
router.get("/refresh-token", authController.refreshToken);

// ==============================
// @route   POST /auth/logout
// @desc    Clear cookies and log user out
// ==============================
router.post("/logout", authController.userLogout);

module.exports = router;
