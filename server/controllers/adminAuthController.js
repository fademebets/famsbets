const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/mailer');
const User = require('../models/User');
// Register Admin
exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = await Admin.create({ email, password: hashedPassword });
    res.status(201).json({ message: 'Admin registered successfully', admin: newAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login Admin
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password incorrect' });

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password - Send Code
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetCode = code;
    admin.resetCodeExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
    await admin.save();

    await transporter.sendMail({
      to: email,
      subject: 'FadeMeBets Admin Password Reset Code',
      text: `Your password reset code is ${code}. It expires in 10 minutes.`
    });

    res.json({ message: 'Reset code sent to email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Code and Reset Password
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    if (admin.resetCode !== code || Date.now() > admin.resetCodeExpiry)
      return res.status(400).json({ message: 'Invalid or expired code' });

    admin.password = await bcrypt.hash(newPassword, 12);
    admin.resetCode = undefined;
    admin.resetCodeExpiry = undefined;
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.notifyLockUpdate = async (req, res) => {
  try {
    const activeUsers = await User.find({ subscriptionStatus: 'active' });

    if (activeUsers.length === 0) {
      return res.status(404).json({ message: 'No active subscribers found.' });
    }

    for (const user of activeUsers) {
      // Skip invalid/test emails
      // if (!user.email.includes('@') || user.email.includes('example.com')) continue;

    await transporter.sendMail({
  to: user.email,
  subject: '🚨 Lock of the Day Updated!',
  html: `
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 24px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="https://www.fademebets.com/logo.png" alt="FadeMeBets" style="max-width: 160px;" />
      </div>
      <h2 style="color: #333; font-size: 22px;">Hey Subscriber,</h2>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        We’re excited to tell you that today’s 🔒 of the day has just been updated on <strong>FadeMeBets</strong>.
        Head on over to our site to view our highest-confidence pick, backed by expert analysis and real-time data!
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://fademebets.com/" style="background-color: #c8102e; color: #fff; padding: 14px 26px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
          View Lock of the Day
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">
        Stay sharp,<br/>
        <strong>FadeMeBets Team</strong>
      </p>
      <p style="font-size: 13px; color: #999; font-style: italic; text-align: center; margin-top: 20px;">
        Born to Fade
      </p>
    </div>
  `
});


    }

    res.json({ message: 'Notification sent to active subscribers.' });

  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ message: 'Server error sending notifications.' });
  }
};
