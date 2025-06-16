const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe requires raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const eventType = event.type;
    console.log(`📩 Received event: ${eventType}`);

    // Handle subscription created or updated
    if (eventType === 'customer.subscription.created' || eventType === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.subscriptionStatus = status;
        await user.save();
        console.log(`🔄 User ${user.email} subscription set to ${status}.`);
      } else {
        console.warn(`⚠️ No user found for customer ID: ${customerId}`);
      }
    }

    // Handle subscription cancellation
    if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.subscriptionStatus = 'inactive';
        await user.save();
        console.log(`❌ User ${user.email} subscription cancelled.`);
      } else {
        console.warn(`⚠️ No user found for customer ID: ${customerId}`);
      }
    }

  } catch (error) {
    console.error('⚠️ Webhook processing error:', error);
    return res.status(500).send('Webhook handling error');
  }

  res.json({ received: true });
});

module.exports = router;
