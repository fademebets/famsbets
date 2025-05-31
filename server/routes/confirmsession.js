const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('../models/User');
const router = express.Router();


router.post('/confirm-session', async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    console.error('Session ID missing in request');
    return res.status(400).json({ message: 'Session ID is required.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      console.error(`No session found for ID: ${sessionId}`);
      return res.status(404).json({ message: 'Session not found.' });
    }

    const stripeCustomerId = session.customer;
    const user = await User.findOne({ stripeCustomerId });

    if (!user) {
      console.error(`No user found for Stripe Customer ID: ${stripeCustomerId}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`JWT generated for user: ${user.email}`);
    res.json({ token });

  } catch (error) {
    console.error('Error confirming session:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


module.exports = router;
