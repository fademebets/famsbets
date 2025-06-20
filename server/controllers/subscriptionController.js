const User = require('../models/User');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PRICES = require('../config/prices');

// Create Checkout Session
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

    // Validate selected plan and get price ID
    const priceId = PRICES[plan];
    if (!priceId) {
      return res.status(400).json({ message: 'Invalid subscription plan selected.' });
    }

    // Cancel existing active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `https://www.fademebets.com/success.html?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&email=${encodeURIComponent(email)}`,
      cancel_url: 'https://www.fademebets.com/subscribe.html',
    });

    res.json({ id: session.id });

  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Confirm Subscription (after successful payment)
exports.confirmSubscription = async (req, res) => {
  try {
    const { sessionId, email, plan } = req.body;
    if (!sessionId || !email || !plan) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent duplicate confirmation for the same session
    if (user.lastSessionId === sessionId) {
      return res.status(400).json({ message: 'This session has already been processed.' });
    }

    // Calculate end date based on plan
    const now = new Date();
    let endDate;
    if (plan === 'monthly') {
      endDate = new Date(now.setMonth(now.getMonth() + 1));
    } else if (plan === 'quarterly') {
      endDate = new Date(now.setMonth(now.getMonth() + 3));
    } else if (plan === 'yearly') {
      endDate = new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      return res.status(400).json({ message: 'Invalid plan.' });
    }

    // Update user subscription status, end date, and store session ID
    user.subscriptionStatus = 'active';
    user.subscriptionEndDate = endDate;
    user.lastSessionId = sessionId;
    await user.save();

    // Create JWT token for this user
    const token = jwt.sign(
      { userId: user._id, email: user.email, subscriptionStatus: 'active' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return success message, end date, and token
    res.json({
      message: 'Subscription activated successfully.',
      subscriptionEndDate: endDate,
      token
    });

  } catch (error) {
    console.error('Confirm subscription error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
