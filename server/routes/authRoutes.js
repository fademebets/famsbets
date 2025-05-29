const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); // where verifyToken lives

router.post('/register', authController.register);
router.post('/login', authController.login);

// Forgot password - send reset code
router.post('/forgot-password', authController.forgotPassword);

// Reset password - verify code and set new password
router.post('/reset-password', authController.resetPassword);


router.post('/change-password', authMiddleware, authController.changePassword);

router.get('/subscription-status', authController.getSubscriptionStatus);


module.exports = router;
