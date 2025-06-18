const User = require('../models/User');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Price data & cancel_at
    let priceData, cancelAfterSeconds;
    if (plan === 'monthly') {
      priceData = {
        currency: 'usd',
        product_data: { name: 'FadeMeBets Monthly Subscription' },
        unit_amount: 299,
        recurring: { interval: 'month' },
      };
      cancelAfterSeconds = 30 * 24 * 60 * 60;
    } else if (plan === 'quarterly') {
      priceData = {
        currency: 'usd',
        product_data: { name: 'FadeMeBets Quarterly Subscription' },
        unit_amount: 799,
        recurring: { interval: 'month', interval_count: 3 },
      };
      cancelAfterSeconds = 182 * 24 * 60 * 60;
    } else if (plan === 'yearly') {
      priceData = {
        currency: 'usd',
        product_data: { name: 'FadeMeBets Yearly Subscription' },
        unit_amount: 2999,
        recurring: { interval: 'year' },
      };
      cancelAfterSeconds = 365 * 24 * 60 * 60;
    } else {
      return res.status(400).json({ message: 'Invalid subscription plan selected.' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price_data: priceData, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        cancel_at: Math.floor(Date.now() / 1000) + cancelAfterSeconds,
      },
      success_url: `https://www.fademebets.com/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'https://www.fademebets.com/subscribe.html',
    });

    res.json({ id: session.id });

  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
