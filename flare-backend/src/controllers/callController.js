const prisma = require('../config/prisma');

// Called by the client once a call ends, to persist history (the actual
// live call itself is handled entirely via Socket.io + WebRTC, not REST).
exports.logCall = async (req, res) => {
  try {
    const { chatId, calleeId, type, status, startedAt, endedAt } = req.body;
    if (!chatId || !calleeId || !type || !status) {
      return res.status(400).json({ error: 'chatId, calleeId, type, status are required' });
    }

    const call = await prisma.callLog.create({
      data: {
        chatId,
        callerId: req.userId,
        calleeId,
        type, // VOICE | VIDEO
        status, // MISSED | ANSWERED | DECLINED
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        endedAt: endedAt ? new Date(endedAt) : null,
      },
    });

    res.status(201).json({ call });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCallHistory = async (req, res) => {
  try {
    const calls = await prisma.callLog.findMany({
      where: { OR: [{ callerId: req.userId }, { calleeId: req.userId }] },
      include: {
        caller: { select: { id: true, username: true, avatarUrl: true } },
        callee: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};