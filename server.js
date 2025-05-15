const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");
connectDB();
require("./config/passport");
require("./utils/scheduler");
const authRoutes = require("./routes/auth.routes");
const leaveRoutes = require("./routes/leave.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
