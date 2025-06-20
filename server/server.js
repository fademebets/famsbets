require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const scrapeRoutes = require('./routes/scrapeRoutes');
const adminRoutes = require('./routes/adminAuthRoutes');
const evRoutes = require('./routes/evRoutes');
const lockRoutes = require('./routes/lockRoutes');
const standingsRoutes = require("./routes/standingsRoutes");
// const stripeWebhookRoute = require('./routes/stripeWebhook');
const confirmSessionRoute = require('./routes/confirmsession');
const authRoutes = require('./routes/authRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const oddsRoutes = require("./routes/oddsRoutes");

// Initialize app
const app = express();

// Connect to DB
connectDB();  // Only this — no mongoose.connect() separately

// CORS setup (before any route)
app.use(cors({
  origin: ['https://fademebets.com', 'https://www.fademebets.com', 'http://127.0.0.1:5500'],
  credentials: true,
}));

// Webhook route (before express.json())
// app.use('/api/stripe', stripeWebhookRoute);

// Body parser middleware
app.use(express.json());

// API routes
app.use('/api/stripe', confirmSessionRoute);
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ev', evRoutes);
app.use('/api/lock', lockRoutes);
app.use('/api', scrapeRoutes);
app.use('/api', standingsRoutes);

app.use("/api/odds", oddsRoutes);
// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
