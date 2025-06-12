const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Common cookie options
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax", //keep Lax for testing only
  secure: process.env.NODE_ENV === "production",
};

exports.refreshToken = async (req, res) => {
  console.log("are you called");
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Return only minimal user info, no tokens in JSON
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
    console.error("Refresh token error:", err);

    res.clearCookie("refreshToken", cookieOptions);

    const status = err.name === "TokenExpiredError" ? 401 : 403;
    return res
      .status(status)
      .json({ message: "Invalid or expired refresh token" });
  }
};

exports.userLogout = async (req, res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res.status(200).json({ message: "Logged out successfully" });
};
