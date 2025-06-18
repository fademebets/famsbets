const User = require('../models/User');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Mapped price IDs for subscription plans
const PRICES = {
  monthly: 'price_1RbHXtLfWCnW3JgT8k6UbFOv',
  quarterly: 'price_1RbHYnLfWCnW3JgT06wzhlLV',
  yearly: 'price_1RbHZSLfWCnW3JgTqGo1LsHe',
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { email, plan } = req.body;

    if (!email || !plan) {
      return res.status(400).json({ message: 'Email and subscription plan are required.' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
      await user.save();
    }

    // Ensure Stripe Customer
    let stripeCustomerId = user.stripeCustomerId;
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (err) {
        if (err.code === 'resource_missing') {
          const newCustomer = await stripe.customers.create({ email });
          stripeCustomerId = newCustomer.id;
          user.stripeCustomerId = newCustomer.id;
          await user.save();
        } else {
          throw err;
        }
      }
    } else {
      const newCustomer = await stripe.customers.create({ email });
      stripeCustomerId = newCustomer.id;
      user.stripeCustomerId = newCustomer.id;
      await user.save();
    }

    // Cancel existing active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }

    // Validate selected plan and get price ID
    const priceId = PRICES[plan];
    if (!priceId) {
      return res.status(400).json({ message: 'Invalid subscription plan selected.' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `https://www.fademebets.com/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'https://www.fademebets.com/subscribe.html',
    });

    // Return session ID
    res.json({ id: session.id });

  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
