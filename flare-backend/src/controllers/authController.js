const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { generateOtp, verifyOtp } = require("../utils/otp");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

exports.requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required" });

    generateOtp(phone);
    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtpAndAuth = async (req, res) => {
  try {
    const { phone, code, publicKey, ageConfirmed } = req.body;
    if (!phone || !code)
      return res.status(400).json({ error: "phone and code are required" });

    const ok = verifyOtp(phone, code);
    if (!ok) return res.status(401).json({ error: "Invalid or expired code" });

   let user = await prisma.user.findUnique({ where: { phone } });
let isNewUser = false;

if (!user) {
  if (!publicKey) {
    return res.status(400).json({ error: "publicKey is required to create a new account" });
  }
  if (!ageConfirmed) {
    return res.status(400).json({ error: "You must confirm you are 18 or older" });
  }
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  user = await prisma.user.create({
    data: {
      phone,
      username: `user_${randomSuffix}`,
      publicKey,
      ageConfirmed: true,
    },
  });
  isNewUser = true;
} else if (publicKey && publicKey !== user.publicKey) {
  // This device generated a new keypair (new install, new device, cleared
  // storage, etc.) - sync the server's public key to match, so future
  // messages encrypt correctly for THIS device's private key.
  // Tradeoff: old message history becomes permanently undecryptable, since
  // it was encrypted for the previous key. Same limitation real apps hit
  // without dedicated multi-device key backup/sync (out of scope for MVP).
  user = await prisma.user.update({
    where: { id: user.id },
    data: { publicKey },
  });
}

    const token = signToken(user.id);
    res.json({
      token,
      isNewUser,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        about: user.about,
        publicKey: user.publicKey,
        onboarded: user.onboarded,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, avatarUrl, about, onboarded } = req.body;

    if (username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== req.userId) {
        return res.status(409).json({ error: "Username already taken" });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(username && { username }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(about !== undefined && { about }),
        ...(onboarded !== undefined && { onboarded }),
      },
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      username: true,
      phone: true,
      avatarUrl: true,
      about: true,
      publicKey: true,
      onboarded: true,
      online: true,
      lastSeen: true,
    },
  });
  res.json({ user });
};

exports.searchUsers = async (req, res) => {
  const q = req.query.q || "";

  const blocks = await prisma.blockedUser.findMany({
    where: { OR: [{ blockerId: req.userId }, { blockedId: req.userId }] },
  });
  const excludedIds = blocks.map((b) => (b.blockerId === req.userId ? b.blockedId : b.blockerId));

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: "insensitive" },
      NOT: { id: { in: [req.userId, ...excludedIds] } },
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      about: true,
      publicKey: true,
      online: true,
      lastSeen: true,
    },
    take: 20,
  });
  res.json({ users });
};
