const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/statusController');

router.use(auth);
router.get('/', ctrl.getStatusFeed);
router.post('/', ctrl.createStatus);
router.post('/view', ctrl.viewStatus);
router.delete('/:statusId', ctrl.deleteStatus);

module.exports = router;