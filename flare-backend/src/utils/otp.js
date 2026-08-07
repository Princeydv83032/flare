// DEV-ONLY OTP store, kept in memory. In production this should live in
// Redis (with TTL) and the OTP should be sent via a real SMS provider
// (Twilio, MSG91, etc.) instead of being logged to the console.
const otpStore = new Map(); // phone -> { code, expiresAt }

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp(phone) {
  const code = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit
  otpStore.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });

  // DEV: log instead of sending a real SMS
  console.log(`[OTP] ${phone} -> ${code}`);
  return code;
}

function verifyOtp(phone, code) {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  const valid = entry.code === code;
  if (valid) otpStore.delete(phone); // one-time use
  return valid;
}

module.exports = { generateOtp, verifyOtp };