const prisma = require('../config/prisma');

// Body: { chatId, type, ciphertext, iv, keys: [{userId, encryptedKey}] }
// Server only ever stores ciphertext - it never sees plaintext content.
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, type = 'TEXT', ciphertext, iv, keys } = req.body;
    if (!chatId || !ciphertext || !iv || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'chatId, ciphertext, iv, keys[] are required' });
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: req.userId } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant of this chat' });

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.userId,
        type,
        ciphertext,
        iv,
        keys: { create: keys.map((k) => ({ userId: k.userId, encryptedKey: k.encryptedKey })) },
        status: { create: { userId: req.userId, deliveredAt: new Date(), readAt: new Date() } },
      },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    });

    await prisma.chat.update({ where: { id: chatId }, data: { lastMessageAt: new Date() } });

    // Bump the streak for this chat (Snap-style daily activity counter)
    const streak = await prisma.streak.findUnique({ where: { chatId } });
    const now = new Date();
    if (!streak) {
      await prisma.streak.create({ data: { chatId, currentCount: 1, lastActivityAt: now } });
    } else {
      const hoursSinceActivity = (now - streak.lastActivityAt) / (1000 * 60 * 60);
      const newCount = hoursSinceActivity > 48 ? 1 : hoursSinceActivity > 20 ? streak.currentCount + 1 : streak.currentCount;
      await prisma.streak.update({ where: { chatId }, data: { currentCount: newCount, lastActivityAt: now } });
    }

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { before, limit = 30 } = req.query;

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: req.userId } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant of this chat' });

    const messages = await prisma.message.findMany({
      where: { chatId, ...(before && { createdAt: { lt: new Date(before) } }) },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        keys: { where: { userId: req.userId } }, // only this user's wrapped key
        media: true,
        reactions: true,
      },
    });

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    await prisma.messageStatus.updateMany({
      where: { messageId: { in: messageIds }, userId: req.userId },
      data: { readAt: new Date(), deliveredAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const reaction = await prisma.reaction.upsert({
      where: { messageId_userId: { messageId, userId: req.userId } },
      update: { emoji },
      create: { messageId, userId: req.userId, emoji },
    });
    res.json({ reaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};