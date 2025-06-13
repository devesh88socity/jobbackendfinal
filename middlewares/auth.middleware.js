const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // Prefer cookie-based auth (secure for web)
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... }
    next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";
    return res
      .status(401)
      .json({ message: isExpired ? "jwt expired" : "Invalid token" });
  }
};

module.exports = authenticate;
