const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe requires the raw body to verify webhook signatures
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const stripeCustomerId = session.customer;

      // Find user by stripeCustomerId
      const user = await User.findOne({ stripeCustomerId });
      if (user) {
        user.subscriptionStatus = 'active';
        await user.save();
        console.log(`User ${user.email} subscription activated.`);
      } else {
        console.warn(`User with Stripe customer ID ${stripeCustomerId} not found.`);
      }
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  res.json({ received: true });
});

module.exports = router;
