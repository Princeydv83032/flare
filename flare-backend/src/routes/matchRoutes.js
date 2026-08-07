const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/matchController');

router.use(auth);
router.get('/deck', ctrl.getDiscoverDeck);
router.post('/swipe', ctrl.swipe);
router.get('/', ctrl.listMyMatches);
router.post('/profile', ctrl.upsertDatingProfile);

module.exports = router;