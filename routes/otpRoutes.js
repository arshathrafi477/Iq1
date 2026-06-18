const express = require("express");
const { sendOtp, verifyOtp } = require("../controllers/otpController");

const router = express.Router();

// POST /api/otp/send
router.post("/send", sendOtp);

// POST /api/otp/verify
router.post("/verify", verifyOtp);

module.exports = router;
