const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/blockController');

router.use(auth);
router.get('/', ctrl.listBlocked);
router.post('/', ctrl.blockUser);
router.post('/unblock', ctrl.unblockUser);

module.exports = router;