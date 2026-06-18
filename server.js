require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const otpStore = new Map();
const OTP_EXPIRY_MS = (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;
const MAX_ATTEMPTS = 5;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOtp(length = parseInt(process.env.OTP_LENGTH) || 6) {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  return crypto.randomInt(min, max).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/otp/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required." });
    }
    const otp = generateOtp();
    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `<div style="font-family:sans-serif;padding:32px;">
        <h2>Your One-Time Password</h2>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;
                    padding:24px;color:#4f46e5;border:2px dashed #e0e7ff;border-radius:6px;">
          ${otp}
        </div>
        <p>Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minute(s). Never share this.</p>
      </div>`,
    });
    return res.status(200).json({ success: true, message: `OTP sent to ${email}.` });
  } catch (err) {
    console.error("[Send OTP Error]", err.message);
    return res.status(500).json({ success: false, message: "Failed to send OTP: " + err.message });
  }
});

app.post("/api/otp/verify", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }
  const key = email.toLowerCase();
  const record = otpStore.get(key);
  if (!record) {
    return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
  }
  if (record.otp !== String(otp)) {
    record.attempts += 1;
    return res.status(400).json({ success: false, message: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining.` });
  }
  otpStore.delete(key);
  return res.status(200).json({ success: true, message: "OTP verified successfully." });
});

app.listen(PORT, () => console.log(`🚀 OTP server running on port ${PORT}`));
