const express = require('express');
const router = express.Router();
const controller = require('../Controllers/payments.controller');
const auth = require('../MiddleWares/auth.middleware');

router.post('/paypal/create',  controller.createPayment);
router.post('/paypal/verify', auth, controller.verifyPayment);

module.exports = router;