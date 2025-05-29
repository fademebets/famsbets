const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  stripeCustomerId: String,
  subscriptionStatus: { type: String, default: 'inactive' },
});

module.exports = mongoose.model('User', userSchema);
