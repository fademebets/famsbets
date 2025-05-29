require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const scrapeRoutes = require('./routes/scrapeRoutes');
const adminRoutes = require('./routes/adminAuthRoutes');
const evRoutes = require('./routes/evRoutes');
const lockRoutes = require('./routes/lockRoutes');

const stripeWebhookRoute = require('./routes/stripeWebhook');

const app = express();  // <-- declare app BEFORE using it!

// IMPORTANT: mount webhook route BEFORE express.json() or any other body parser
app.use('/api/stripe', stripeWebhookRoute);

connectDB(); // Connect to DB when server starts

app.use(express.json());
app.use(cors({
  origin: ['https://fademebets.com', 'http://localhost:3000'],
  credentials: true,
}));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('Mongo Error', err));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));


// app.use('/api', scrapeRoutes); // <-- Correctly mounted scrape routes


app.use('/api/admin', adminRoutes);
app.use('/api/ev', evRoutes);

app.use('/api/lock', lockRoutes);
app.use('/api', scrapeRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
