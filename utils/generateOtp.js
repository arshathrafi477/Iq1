const crypto = require("crypto");

/**
 * Generates a cryptographically secure numeric OTP.
 * @param {number} length - Number of digits (default: env OTP_LENGTH or 6)
 * @returns {string} Zero-padded OTP string
 */
function generateOtp(length = parseInt(process.env.OTP_LENGTH) || 6) {
  if (length < 4 || length > 10) {
    throw new RangeError("OTP length must be between 4 and 10 digits.");
  }

  const max = Math.pow(10, length);          // e.g. 1_000_000 for 6 digits
  const min = Math.pow(10, length - 1);      // e.g.   100_000 for 6 digits

  // crypto.randomInt(min, max) is uniformly distributed — no modulo bias
  const otp = crypto.randomInt(min, max);
  return otp.toString();
}

module.exports = { generateOtp };
