//controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// exports.refreshToken = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const token = jwt.sign(
//       {
//         id: user._id,
//         email: user.email,
//         role: user.role,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.status(200).json({
//       message: "Token refreshed successfully",
//       token,
//       user,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.refreshToken = async (req, res) => {
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

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

exports.userLogout = async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ message: "Logged out successfully" });
};
