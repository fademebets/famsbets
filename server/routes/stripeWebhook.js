const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
    console.log(`📩 Event received: ${eventType}`);

    const subscriptionEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ];

    if (subscriptionEvents.includes(eventType)) {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.subscriptionStatus = eventType === 'customer.subscription.deleted' ? 'inactive' : status;
        await user.save();
        console.log(`🔄 User ${user.email} subscription set to ${user.subscriptionStatus}.`);
      } else {
        console.warn(`⚠️ No user found for customer ID: ${customerId}`);
      }
    }

    // Optionally log first successful payment
    if (eventType === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      console.log(`💰 Payment succeeded for customer: ${customerId}`);
    }

    // Optionally log checkout session completions
    if (eventType === 'checkout.session.completed') {
      const session = event.data.object;
      console.log(`✅ Checkout session completed for session: ${session.id}`);
    }

  } catch (error) {
    console.error('⚠️ Webhook processing error:', error);
    return res.status(500).send('Webhook handling error');
  }

  res.json({ received: true });
});

module.exports = router;
