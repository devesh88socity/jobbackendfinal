const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const isProduction = process.env.NODE_ENV === "production";

// ==============================
// Common Cookie Options
// ==============================
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "None" : "Lax", // ❗ Important for cross-origin cookies
  secure: isProduction,
};

// ==============================
// @route   GET /auth/refresh-token
// @desc    Generate new access token using refresh token
// ==============================
exports.refreshToken = async (req, res) => {
  console.log("[REFRESH TOKEN] Attempting refresh...");

  const token = req.cookies.refreshToken;
  if (!token) {
    console.warn("[REFRESH TOKEN] No refresh token in cookies");
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.warn("[REFRESH TOKEN] User not found");
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
    });

    console.log("[REFRESH TOKEN] Success");

    return res.status(200).json({
      message: "Token refreshed successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[REFRESH TOKEN] Error verifying token:", err.message);

    res.clearCookie("refreshToken", cookieOptions);

    const status = err.name === "TokenExpiredError" ? 401 : 403;
    return res
      .status(status)
      .json({ message: "Invalid or expired refresh token" });
  }
};

// ==============================
// @route   POST /auth/logout
// @desc    Clear access and refresh tokens from cookies
// ==============================
exports.userLogout = async (req, res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  console.log("[LOGOUT] User logged out");

  return res.status(200).json({ message: "Logged out successfully" });
};
