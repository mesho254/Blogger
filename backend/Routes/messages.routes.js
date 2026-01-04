const express = require('express');
const router = express.Router();
const controller = require('../Controllers/messages.controller');
const auth = require('../MiddleWares/auth.middleware');

router.get('/conversations', auth, controller.getConversations);
router.get('/conversations/:id/messages', auth, controller.getMessages);

module.exports = router;