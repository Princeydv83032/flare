const prisma = require('../config/prisma');

exports.createStatus = async (req, res) => {
  try {
    const { mediaUrl, caption } = req.body;
    if (!mediaUrl) return res.status(400).json({ error: 'mediaUrl is required' });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const status = await prisma.status.create({
      data: { userId: req.userId, mediaUrl, caption, expiresAt },
    });

    res.status(201).json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Stories feed: only non-expired statuses, grouped by user
exports.getStatusFeed = async (req, res) => {
  try {
    const statuses = await prisma.status.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        views: { where: { viewerId: req.userId } }, // so client knows if I've seen it
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ statuses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.viewStatus = async (req, res) => {
  try {
    const { statusId } = req.body;
    const view = await prisma.statusView.upsert({
      where: { statusId_viewerId: { statusId, viewerId: req.userId } },
      update: {},
      create: { statusId, viewerId: req.userId },
    });
    res.json({ view });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const status = await prisma.status.findUnique({ where: { id: statusId } });
    if (!status || status.userId !== req.userId) {
      return res.status(403).json({ error: 'Not your status' });
    }
    await prisma.status.delete({ where: { id: statusId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};