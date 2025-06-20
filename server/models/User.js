const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  stripeCustomerId: String,
  subscriptionStatus: { type: String, default: 'inactive' },
  resetCode: { type: String },
    subscriptionEndDate: { type: Date },  // <-- new field
  resetCodeExpiry: { type: Date },
  lastSessionId: { type: String },

});

module.exports = mongoose.model('User', userSchema);
