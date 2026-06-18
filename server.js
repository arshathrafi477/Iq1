require("dotenv").config();
const express = require("express");
const otpRoutes = require("./routes/otpRoutes");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/otp", otpRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 OTP server running on port ${PORT}`);
});
