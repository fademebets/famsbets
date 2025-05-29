const User = require('../models/User');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const { plan } = req.body;

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user has a valid Stripe customer, if not create one
    let stripeCustomerId = user.stripeCustomerId;

    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (err) {
        // If customer not found in Stripe, create a new one
        if (err.code === 'resource_missing') {
          const newCustomer = await stripe.customers.create({ email: user.email });
          stripeCustomerId = newCustomer.id;
          user.stripeCustomerId = newCustomer.id;
          await user.save();
        } else {
          throw err; // rethrow other unexpected errors
        }
      }
    } else {
      // No customer ID, create one
      const newCustomer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = newCustomer.id;
      user.stripeCustomerId = newCustomer.id;
      await user.save();
    }

    // Price details based on selected plan
    let priceData;

    if (plan === 'monthly') {
      priceData = {
        currency: 'usd',
        product_data: { name: 'FadeMeBets Monthly Subscription' },
        unit_amount: 299,
        recurring: { interval: 'month' },
      };
    } else if (plan === 'quarterly') {
      priceData = {
        currency: 'usd',
        product_data: { name: 'FadeMeBets Quarterly Subscription' },
        unit_amount: 799,
        recurring: { interval: 'month', interval_count: 3 },
      };
    } else if (plan === 'yearly') {
      priceData = {
        currency: 'usd',
        product_data: { name: 'FadeMeBets Yearly Subscription' },
        unit_amount: 2999,
        recurring: { interval: 'year' },
      };
    } else {
      return res.status(400).json({ message: 'Invalid subscription plan selected.' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price_data: priceData, quantity: 1 }],
      mode: 'subscription',
      success_url: 'http://127.0.0.1:5500/',
      cancel_url: 'http://127.0.0.1:5500/subscribe.html',
    });

    res.json({ id: session.id });


  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

