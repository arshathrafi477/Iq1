const express = require("express");
const { sendOtp, verifyOtp } = require("../controllers/otpController");

const router = express.Router();

// POST /api/otp/send    — generate & email an OTP
router.post("/send", sendOtp);

// POST /api/otp/verify  — validate a submitted OTP
router.post("/verify", verifyOtp);

module.exports = router;
