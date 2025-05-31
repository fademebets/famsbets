require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

const scrapeRoutes = require('./routes/scrapeRoutes');
const adminRoutes = require('./routes/adminAuthRoutes');
const evRoutes = require('./routes/evRoutes');
const lockRoutes = require('./routes/lockRoutes');
const standingsRoutes = require("./routes/standingsRoutes");

const stripeWebhookRoute = require('./routes/stripeWebhook');
const ConfirmSession = require('./routes/confirmsession');

const app = express();

// 1. Mount Stripe webhook route FIRST because it requires raw body for signature verification
app.use('/api/stripe/webhook', stripeWebhookRoute);

// 2. Enable CORS middleware before other routes (except webhook)
app.use(cors({
  origin: [
    'https://fademebets.com',
    'https://www.fademebets.com',
    'http://127.0.0.1:5500'
  ],
  credentials: true,
}));

// 3. Parse incoming JSON requests for other routes
app.use(express.json());

// 4. Mount other Stripe routes (like confirm-session) after CORS and JSON middleware
app.use('/api/stripe', ConfirmSession);

// 5. Mount other API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/admin', adminRoutes);
app.use('/api/ev', evRoutes);
app.use('/api/lock', lockRoutes);
app.use('/api', scrapeRoutes);
app.use('/api', standingsRoutes);

// Connect to MongoDB
connectDB();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
