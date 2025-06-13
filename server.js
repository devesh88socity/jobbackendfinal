require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const connectDB = require("./config/db");
const indexRoutes = require("./routes/index.routes");

// Connect to DB
connectDB();

// Load passport strategies and schedulers
require("./config/passport");
require("./utils/scheduler");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// ==============================
// CORS Configuration
// ==============================
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: "https://jobfrontendfinal.vercel.app",
    credentials: true,
  })
);

// ==============================
// Middlewares
// ==============================
app.use(helmet()); // Adds security headers
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies
app.use(passport.initialize()); // Initialize Passport

// ==============================
// Routes
// ==============================
app.use("/api", indexRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ==============================
// 404 Handler
// ==============================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ==============================
// Global Error Handler
// ==============================
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({
    message: "Internal Server Error",
    error: isProduction ? undefined : err.message,
  });
});

// ==============================
// Start Server
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
