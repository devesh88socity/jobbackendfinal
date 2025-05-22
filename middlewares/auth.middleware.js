const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // Prioritize cookie over header for access token
  const token =
    req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Makes req.user available to controllers
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "jwt expired" }); // important for auto-refresh logic
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticate;
