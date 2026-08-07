const prisma = require('../config/prisma');

// Record a swipe. If it's a LIKE/SUPER_LIKE and the other person already
// liked back, create a Match + auto-create the Chat for them.
exports.swipe = async (req, res) => {
  try {
    const { swipedUserId, direction } = req.body; // direction: LIKE | PASS | SUPER_LIKE
    if (!swipedUserId || !direction) {
      return res.status(400).json({ error: 'swipedUserId and direction are required' });
    }

    await prisma.swipe.upsert({
      where: { swiperId_swipedUserId: { swiperId: req.userId, swipedUserId } },
      update: { direction },
      create: { swiperId: req.userId, swipedUserId, direction },
    });

    if (direction === 'PASS') {
      return res.json({ matched: false });
    }

    // Check if the other person already liked us back
    const theirSwipe = await prisma.swipe.findUnique({
      where: { swiperId_swipedUserId: { swiperId: swipedUserId, swipedUserId: req.userId } },
    });

    const theyLikedUs = theirSwipe && (theirSwipe.direction === 'LIKE' || theirSwipe.direction === 'SUPER_LIKE');
    if (!theyLikedUs) {
      return res.json({ matched: false });
    }

    // Mutual like - create the match + chat (order userA/userB consistently
    // to satisfy the @@unique constraint regardless of who swiped last)
    const [userAId, userBId] = [req.userId, swipedUserId].sort();

    const existing = await prisma.match.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (existing) return res.json({ matched: true, match: existing });

    const chat = await prisma.chat.create({ data: { isGroup: false } });
    await prisma.chatParticipant.createMany({
      data: [{ chatId: chat.id, userId: userAId }, { chatId: chat.id, userId: userBId }],
    });

    const match = await prisma.match.create({
      data: { userAId, userBId, chatId: chat.id },
      include: {
        userA: { select: { id: true, username: true, avatarUrl: true } },
        userB: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.json({ matched: true, match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Discover deck: dating-visible profiles the current user hasn't swiped on yet.
exports.getDiscoverDeck = async (req, res) => {
  try {
    const alreadySwiped = await prisma.swipe.findMany({
      where: { swiperId: req.userId },
      select: { swipedUserId: true },
    });
    const excludeIds = [req.userId, ...alreadySwiped.map((s) => s.swipedUserId)];

    const profiles = await prisma.datingProfile.findMany({
      where: { visible: true, userId: { notIn: excludeIds } },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      take: 20,
    });

    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listMyMatches = async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
      include: {
        userA: { select: { id: true, username: true, avatarUrl: true } },
        userB: { select: { id: true, username: true, avatarUrl: true } },
        chat: true,
      },
      orderBy: { matchedAt: 'desc' },
    });
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create or update the current user's dating profile + "Dating mode" visibility
exports.upsertDatingProfile = async (req, res) => {
  try {
    const { bio, photos, prompts, gender, interestedIn, visible, latitude, longitude } = req.body;

    const profile = await prisma.datingProfile.upsert({
      where: { userId: req.userId },
      update: { bio, photos, prompts, gender, interestedIn, visible, latitude, longitude },
      create: { userId: req.userId, bio, photos, prompts, gender, interestedIn, visible, latitude, longitude },
    });

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};