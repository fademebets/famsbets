const EV = require('../models/EV');

// Create new EV entry
exports.createEV = async (req, res) => {
  try {
    const { title, description, odds, evValue, coverPercentage } = req.body;

    if (!title || !odds || evValue === undefined || coverPercentage === undefined) {
      return res.status(400).json({ message: 'Title, odds, EV value, and cover percentage are required' });
    }

    const newEV = await EV.create({ title, description, odds, evValue, coverPercentage });
    res.status(201).json({ message: 'EV of the Day created successfully', ev: newEV });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get today's EV of the Day
exports.getTodayEV = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find all EVs with date between startOfDay and endOfDay
    const evs = await EV.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: -1 });

    if (!evs.length) return res.status(404).json({ message: 'No EVs found for today' });

    res.json({ evs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Optionally: get all EVs (for admin overview)
exports.getAllEVs = async (req, res) => {
  try {
    const evs = await EV.find().sort({ date: -1 });
    res.json({ evs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete a specific EV entry (Admin only)
exports.deleteEV = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEV = await EV.findByIdAndDelete(id);
    if (!deletedEV) {
      return res.status(404).json({ message: 'EV entry not found' });
    }

    res.json({ message: 'EV entry deleted successfully', ev: deletedEV });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
