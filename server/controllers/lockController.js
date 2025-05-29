const Lock = require('../models/Lock');

// Create Lock of the Day (Admin only)
exports.createLock = async (req, res) => {
  try {
    const { sport, game, pick, odds, confidence, analysis } = req.body;

    if (!sport || !game || !pick || !odds || !confidence || !analysis) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newLock = await Lock.create({ sport, game, pick, odds, confidence, analysis });
    res.status(201).json({ message: 'Lock of the Day created successfully', lock: newLock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get today's Lock of the Day (public)
exports.getTodayLock = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lock = await Lock.findOne({ date: { $gte: today } }).sort({ date: -1 });
    if (!lock) return res.status(404).json({ message: 'No Lock of the Day found' });

    res.json({ lock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Optionally: get all locks (admin only)
exports.getAllLocks = async (req, res) => {
  try {
    const locks = await Lock.find().sort({ date: -1 });
    res.json({ locks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete a specific Lock of the Day (Admin only)
exports.deleteLock = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedLock = await Lock.findByIdAndDelete(id);
    if (!deletedLock) {
      return res.status(404).json({ message: 'Lock not found' });
    }

    res.json({ message: 'Lock deleted successfully', lock: deletedLock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
