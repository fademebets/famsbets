const mongoose = require('mongoose');

const evSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  odds: { type: Number, required: true },
  evValue: { type: Number, required: true },         // EV percentage value
  coverPercentage: { type: Number, required: true }, // Cover percentage
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EV', evSchema);
