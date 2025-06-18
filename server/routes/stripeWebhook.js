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

    // Subscription events
    if (['customer.subscription.created', 'customer.subscription.updated'].includes(eventType)) {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;
      const periodEnd = new Date(subscription.current_period_end * 1000);

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.subscriptionStatus = status;
        user.subscriptionEndDate = periodEnd;
        await user.save();
        console.log(`🔄 User ${user.email} updated: ${status}, ends at ${periodEnd}`);
      } else {
        console.warn(`⚠️ No user found for customer ID: ${customerId}`);
      }
    }

    // Subscription deleted
    if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.subscriptionStatus = 'inactive';
        await user.save();
        console.log(`❌ User ${user.email} subscription set to inactive`);
      }
    }

    // Optionally log successful payments
    if (eventType === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      console.log(`💰 Payment succeeded for customer: ${invoice.customer}`);
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
