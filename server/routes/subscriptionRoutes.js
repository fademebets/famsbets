const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create-checkout-session', authMiddleware, subscriptionController.createCheckoutSession);

module.exports = router;
