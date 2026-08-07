const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/callController');

router.use(auth);
router.post('/', ctrl.logCall);
router.get('/', ctrl.getCallHistory);

module.exports = router;