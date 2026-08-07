const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/request-otp', ctrl.requestOtp);
router.post('/verify-otp', ctrl.verifyOtpAndAuth);
router.patch('/profile', auth, ctrl.updateProfile);
router.get('/me', auth, ctrl.me);
router.get('/search', auth, ctrl.searchUsers);

module.exports = router;