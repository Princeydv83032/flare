const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/chatController');

router.use(auth);
router.get('/', ctrl.listMyChats);
router.get('/streaks', ctrl.getMyStreaks);
router.post('/direct', ctrl.getOrCreateDirectChat);
router.post('/group', ctrl.createGroup);
router.post('/group/add-member', ctrl.addGroupMember);
router.post('/disappearing', ctrl.setDisappearing);

module.exports = router;