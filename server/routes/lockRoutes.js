const express = require('express');
const router = express.Router();
const lockController = require('../controllers/lockController');
const adminMiddleware = require('../middlewares/adminAuth');

// Create Lock (Admin only)
router.post('/create', adminMiddleware, lockController.createLock);

// Get today's Lock (Public)
router.get('/today', lockController.getTodayLock);

// Get all Locks (Admin only)
router.get('/all', adminMiddleware, lockController.getAllLocks);

router.delete('/delete/:id', adminMiddleware, lockController.deleteLock);


module.exports = router;
