const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  stripeCustomerId: String,
  subscriptionStatus: { type: String, default: 'inactive' },
  resetCode: { type: String },
  resetCodeExpiry: { type: Date },
});

module.exports = mongoose.model('User', userSchema);
