const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail } = require("../services/emailService");

const EXPIRY_MS = (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * In-memory OTP store.
 * Shape: { [email]: { otp, expiresAt, attempts } }
 *
 * ⚠️  Replace with Redis (or another persistent store) for production
 *     so OTPs survive restarts and work across multiple instances.
 */
const otpStore = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────────

function storeOtp(email, otp) {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + EXPIRY_MS,
    attempts: 0,
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/otp/send
 * Body: { email }
 */
async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "A valid email address is required." });
    }

    const otp = generateOtp();
    storeOtp(email.toLowerCase(), otp);

    await sendOtpEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minute(s).`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/otp/verify
 * Body: { email, otp }
 */
function verifyOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  const key = email.toLowerCase();
  const record = otpStore.get(key);

  // ── Does a record exist? ──────────────────────────────────────────────────
  if (!record) {
    return res.status(400).json({ success: false, message: "No OTP found for this email. Please request a new one." });
  }

  // ── Expired? ──────────────────────────────────────────────────────────────
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
  }

  // ── Too many attempts? ────────────────────────────────────────────────────
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return res.status(429).json({ success: false, message: "Too many failed attempts. Please request a new OTP." });
  }

  // ── OTP match? ────────────────────────────────────────────────────────────
  if (record.otp !== String(otp)) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return res.status(400).json({
      success: false,
      message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
    });
  }

  // ── Success — invalidate immediately (single-use) ─────────────────────────
  otpStore.delete(key);
  return res.status(200).json({ success: true, message: "OTP verified successfully." });
}

module.exports = { sendOtp, verifyOtp };
