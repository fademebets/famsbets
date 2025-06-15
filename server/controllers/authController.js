const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/mailer'); // Adjust this path to your mail config

exports.register = async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const newUser = await User.create({ email, password: hashedPassword });
    res.status(201).json({ message: 'User created', userId: newUser._id });
  } catch (err) {
    res.status(500).json({ error: 'Email already in use' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.json({
    token,
    subscriptionStatus: user.subscriptionStatus,
  });
};



exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await transporter.sendMail({
      from: `"FadeMeBets" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FadeMeBets Password Reset Code',
      html: `
        <div style="max-width: 500px; margin: auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #ddd; background: #f9f9f9;">
          <h2 style="color: #c8102e;">Password Reset Code</h2>
          <p style="font-size: 16px; color: #333;">Your password reset code is:</p>
          <div style="font-size: 28px; font-weight: bold; margin: 20px 0; color: #000;">${code}</div>
          <p style="font-size: 14px; color: #555;">This code will expire in 10 minutes.</p>
          <p style="font-size: 13px; color: #999; margin-top: 20px;">If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`✅ Reset code sent to: ${email}`);
    res.json({ message: 'Reset code sent to email' });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error sending reset code' });
  }
};

// Verify Code and Reset Password
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
    }

    // Make sure both values are treated as strings for comparison
    if (user.resetCode.toString() !== code.toString()) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Check for expiry
    if (Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Reset code expired' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    // Clear reset code and expiry
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.changePassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.userId; // set via your authMiddleware

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getSubscriptionStatus = async (req, res) => {
  console.time('SubscriptionStatus API');

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    console.time('JWT Verification');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.timeEnd('JWT Verification');

    console.time('Mongo User Fetch');
    const user = await User.findById(decoded.userId);
    console.timeEnd('Mongo User Fetch');

    if (!user) return res.status(404).json({ message: 'User not found' });

    console.timeEnd('SubscriptionStatus API');

    res.json({
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};



// Unsubscribe User
exports.unsubscribeUser = async (req, res) => {
  const userId = req.userId; // coming from your authMiddleware

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.subscriptionStatus = 'inactive';
    await user.save();

    res.json({ message: 'Your subscription has been successfully cancelled. We hope to see you back soon!' });
  } catch (error) {
    console.error('Error in unsubscribeUser:', error);
    res.status(500).json({ message: 'An error occurred while processing your unsubscription request.' });
  }
};
