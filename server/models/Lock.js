const mongoose = require('mongoose');

const lockSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  game: { type: String, required: true },
  pick: { type: String, required: true },
  odds: { type: String, required: true },       // Odds often come as strings like "-110"
  confidence: { type: String, required: true }, // e.g. "85%"
  analysis: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lock', lockSchema);
