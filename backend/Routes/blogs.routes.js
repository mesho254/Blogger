const express = require('express');
const router = express.Router();
const controller = require('../Controllers/blogs.controller');
const auth = require('../MiddleWares/auth.middleware');

router.get('/', controller.getBlogs);
router.get('/featured', controller.getFeatured);
router.get('/:id', controller.getBlog);
router.post('/', auth, controller.upload.single('file'), controller.createBlog);
router.put('/:id', auth, controller.upload.single('file'), controller.updateBlog);
router.delete('/:id', auth, controller.deleteBlog);
router.post('/:id/like', auth, controller.toggleLike);
router.post('/:id/bookmark', auth, controller.toggleBookmark);
router.post('/:id/view', controller.incrementView);
router.post('/upload', auth, controller.upload.single('file'), controller.uploadImage);

module.exports = router;