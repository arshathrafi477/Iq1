const nodemailer = require("nodemailer");

// ── Transport (created once, reused for all sends) ───────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",   // true = TLS on port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an OTP to the specified email address.
 * @param {string} to      - Recipient email
 * @param {string} otp     - The OTP to send
 * @param {number} expiry  - Expiry in minutes (used in email body)
 * @returns {Promise<object>} Nodemailer info object
 */
async function sendOtpEmail(to, otp, expiry = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Your One-Time Password (OTP)",
    text: `Your OTP is: ${otp}\n\nThis code expires in ${expiry} minute(s). Do not share it with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="margin-top:0;color:#111827;">Your One-Time Password</h2>
        <p style="color:#6b7280;">Use the code below to verify your identity. It expires in <strong>${expiry} minute(s)</strong>.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;
                    padding:24px 0;color:#4f46e5;border:2px dashed #e0e7ff;border-radius:6px;margin:24px 0;">
          ${otp}
        </div>
        <p style="color:#ef4444;font-size:13px;">🔒 Never share this code with anyone. We will never ask for it.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] OTP sent to ${to} — Message ID: ${info.messageId}`);
  return info;
}

module.exports = { sendOtpEmail };
