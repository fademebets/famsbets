const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');

const adminAuth = require('../middlewares/adminAuth');

router.post('/register', adminAuthController.register);
router.post('/login', adminAuthController.login);
router.post('/forgot-password', adminAuthController.forgotPassword);
router.post('/reset-password', adminAuthController.resetPassword);

router.post('/notify-lock-update', adminAuthController.notifyLockUpdate);

// Protected Route Example (Change Password)
router.post('/change-password', adminAuth, adminAuthController.changePassword);

router.get('/profile', adminAuth, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
