const express = require('express');
const router = express.Router();
const controller = require('../Controllers/comments.controller');
const auth = require('../MiddleWares/auth.middleware');

router.post('/blogs/:id/comments', auth, controller.createComment);
router.get('/blogs/:id/comments', controller.getComments);
router.put('/comments/:id', auth, controller.updateComment);
router.delete('/comments/:id', auth, controller.deleteComment);

module.exports = router;