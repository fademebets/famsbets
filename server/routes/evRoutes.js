const express = require('express');
const router = express.Router();
const evController = require('../controllers/evController');
const adminAuth = require('../middlewares/adminAuth');

// Create EV (admin only)
router.post('/create', adminAuth, evController.createEV);

// Get today's EV (public)
router.get('/today', evController.getTodayEV);

// Get all EVs (admin only)
router.get('/all', adminAuth, evController.getAllEVs);


router.delete('/delete/:id', adminAuth, evController.deleteEV);


module.exports = router;
