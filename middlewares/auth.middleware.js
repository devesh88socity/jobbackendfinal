const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const accessTokenFromCookie = req.cookies?.accessToken;
  const accessTokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  const token = accessTokenFromCookie || accessTokenFromHeader;

  // console.log("🧪 Cookie Access Token:", accessTokenFromCookie);
  // console.log("🧪 Header Access Token:", accessTokenFromHeader);
  // console.log("🧪 Full Cookies Object:", req.cookies);
  // console.log("🧪 Authorization Header:", req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: "Access Denied: No token found in cookies or headers",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add decoded user info to request
    next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";
    return res.status(401).json({
      message: isExpired
        ? "Access Denied: JWT expired"
        : "Access Denied: Invalid token",
      error:
        !process.env.NODE_ENV || process.env.NODE_ENV !== "production"
          ? err.message
          : undefined,
    });
  }
};

module.exports = authenticate;
