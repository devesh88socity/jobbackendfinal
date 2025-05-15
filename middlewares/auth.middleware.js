// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("token", token);
  if (!token)
    return res.status(401).json({ message: "Access Denied: No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // id and role
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticate;
