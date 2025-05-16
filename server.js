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

const indexRoutes = require("./routes/index.routes");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api", indexRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
