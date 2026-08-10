const prisma = require('../config/prisma');

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (userId === req.userId) return res.status(400).json({ error: "You can't block yourself" });

    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: req.userId, blockedId: userId } },
      update: {},
      create: { blockerId: req.userId, blockedId: userId },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    await prisma.blockedUser.deleteMany({
      where: { blockerId: req.userId, blockedId: userId },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listBlocked = async (req, res) => {
  try {
    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: req.userId },
      include: { blocked: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ blocked: blocked.map((b) => b.blocked) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Used internally by other controllers to check blocking either direction
// before allowing a chat/message/match to happen.
exports.isBlockedEitherWay = async (userAId, userBId) => {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  return !!block;
};