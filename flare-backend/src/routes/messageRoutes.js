const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/messageController');
const uploadCtrl = require('../controllers/uploadController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

router.use(auth);
router.post('/upload', upload.single('file'), uploadCtrl.uploadFile);
router.post('/', ctrl.sendMessage);
router.get('/:chatId', ctrl.getMessages);
router.post('/read', ctrl.markRead);
router.post('/react', ctrl.addReaction);

module.exports = router;