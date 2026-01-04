const express = require('express');
const router = express.Router();
const controller = require('../Controllers/users.controller');
const auth = require('../MiddleWares/auth.middleware');


router.get('/me', auth, controller.getMe);
router.get('/:id', auth, controller.getUser);
router.put('/:id', auth, controller.updateUser);
router.post('/:id/follow', auth, controller.toggleFollow);

module.exports = router;