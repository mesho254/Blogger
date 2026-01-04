const express = require('express');
const router = express.Router();
const controller = require('../Controllers/admin.controller');
const auth = require('../MiddleWares/auth.middleware');

// Stats and analytics
router.get('/stats', auth, controller.getStats);
router.get('/analytics', auth, controller.getAnalytics);

// User management
router.get('/users', auth, controller.getUsers);
router.put('/users/:id/role', auth, controller.updateUserRole);

// Post management
router.get('/posts', auth, controller.getPosts);
router.delete('/posts/:id', auth, controller.deletePost);
router.put('/posts/:id/feature', auth, controller.featurePost);

// Comment management
router.get('/comments', auth, controller.getComments);
router.delete('/comments/:id', auth, controller.deleteComment);

// Ad management
router.put('/ads', auth, controller.updateAds);

module.exports = router;