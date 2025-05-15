// middlewares/role.middleware.js
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    console.log(req.user);
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access Denied: Insufficient role" });
    }
    next();
  };
};

module.exports = allowRoles;
