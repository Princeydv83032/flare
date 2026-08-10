const prisma = require('../config/prisma');

const participantSelect = {
  select: {
    user: {
      select: { id: true, username: true, avatarUrl: true, publicKey: true, online: true, lastSeen: true },
    },
    isAdmin: true,
  },
};

exports.getOrCreateDirectChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    if (await isBlockedEitherWay(req.userId, userId)) {
      return res.status(403).json({ error: 'Cannot start a chat with this user' });
    }

    const existing = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: { some: { userId: req.userId } },
        AND: { participants: { some: { userId } } },
      },
      include: { participants: participantSelect },
    });

    if (existing && existing.participants.length === 2) {
      return res.json({ chat: existing });
    }

    const chat = await prisma.chat.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: req.userId }, { userId }],
        },
      },
      include: { participants: participantSelect },
    });

    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { groupName, participantIds } = req.body;
    if (!groupName || !Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({ error: 'groupName and participantIds[] required' });
    }

    const allIds = Array.from(new Set([...participantIds, req.userId]));

    const chat = await prisma.chat.create({
      data: {
        isGroup: true,
        groupName,
        participants: {
          create: allIds.map((id) => ({ userId: id, isAdmin: id === req.userId })),
        },
      },
      include: { participants: participantSelect },
    });

    res.status(201).json({ chat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listMyChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId: req.userId } } },
      include: {
        participants: participantSelect,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        streak: true,
        disappearingSetting: true,
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    res.json({ chats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addGroupMember = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });
    if (!chat || !chat.isGroup) return res.status(404).json({ error: 'Group not found' });

    const isAdmin = chat.participants.some((p) => p.userId === req.userId && p.isAdmin);
    if (!isAdmin) return res.status(403).json({ error: 'Only admins can add members' });

    const alreadyIn = chat.participants.some((p) => p.userId === userId);
    if (!alreadyIn) {
      await prisma.chatParticipant.create({ data: { chatId, userId } });
    }

    const updated = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: participantSelect },
    });

    res.json({ chat: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setDisappearing = async (req, res) => {
  try {
    const { chatId, enabled, expiryDuration } = req.body;

    const setting = await prisma.disappearingSetting.upsert({
      where: { chatId },
      update: { enabled, ...(expiryDuration && { expiryDuration }) },
      create: { chatId, enabled, expiryDuration: expiryDuration || 86400 },
    });

    res.json({ setting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};