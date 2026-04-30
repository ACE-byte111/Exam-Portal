const express = require('express');
const crypto = require('crypto');
const firestore = require('../services/firestoreService');
const nodemailer = require('nodemailer');
const dns = require('dns');
const router = express.Router();

// Force IPv4 for Render compatibility (fixes ENETUNREACH on IPv6)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const { requireAuth } = require('../middleware/auth');

// Temporary in-memory store for OTPs (In prod use Redis or Firestore TTL)
const otpCache = new Map();

// Generate simplistic access token
const generateToken = (user) => {
  return Buffer.from(JSON.stringify(user)).toString('base64');
};

// Mailer configuration using SMTP / Gmail
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        // Essential for cloud providers like Render that might have IPv6 issues
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });
  }
  return null;
};

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Always generate '123456' for the specified demo accounts for convenience, otherwise true randomness.
  const isDemoAccount = ['instructor@university.edu', 'student1@university.edu'].includes(email);
  const otp = isDemoAccount ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP in cache for 5 minutes
  otpCache.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  const transporter = createTransporter();
  console.log(`[OTP] Attempting to send OTP to ${email}. Transporter ready: ${!!transporter}`);
  
  if (transporter) {
    try {
      console.log(`[OTP] Sending email via ${process.env.EMAIL_USER}...`);
      const info = await transporter.sendMail({
        from: `"Exam Portal Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Exam Portal OTP',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Exam Portal Security</h2>
            <p>You requested to log in. Please use the following One-Time Password to continue:</p>
            <h1 style="color: #4285F4; tracking: 2px;">${otp}</h1>
            <p style="color: #666; font-size: 12px;">This code will expire in 5 minutes.</p>
          </div>
        `
      });
      console.log(`[OTP] Success! Message ID: ${info.messageId}`);
    } catch (err) {
      console.error(`[OTP] SMTP Error:`, err.message);
      console.log(`[EMERGENCY] Here is your OTP: ${otp}`);
    }
  } else {
    console.error(`[OTP] ERROR: No EMAIL_USER or EMAIL_PASS found in Render environment variables!`);
    console.log(`[EMERGENCY] Here is your OTP: ${otp}`);
  }

  res.json({ message: 'OTP processed. Please enter it to continue.' });
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const cached = otpCache.get(email);
    if (!cached || cached.otp !== otp || Date.now() > cached.expiresAt) {
      // If it's a demo account and they used 123456 prior to starting the cache, we can forgive for the demo
      const isDemoAccount = ['instructor@university.edu', 'student1@university.edu'].includes(email);
      if (!(isDemoAccount && otp === '123456')) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
      }
    }

    // OTP is correct! Determine strict role.
    const instructorEmail = process.env.INSTRUCTOR_EMAIL || 'instructor@university.edu';
    const role = (email === instructorEmail) ? 'instructor' : 'student';

    // Create or Update User Database Record
    let user = await firestore.getUser(email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
        role,
        createdAt: new Date().toISOString()
      };
      await firestore.createUser(user);
    } else if (user.role !== role) {
      // Force role update if backend .env changed
      user.role = role;
      await firestore.createUser(user); // Update existing
    }

    // Clear cache after successful use
    otpCache.delete(email);

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ user, token });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await firestore.getUser(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

module.exports = router;
