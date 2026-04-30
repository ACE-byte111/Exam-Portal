const express = require('express');
const crypto = require('crypto');
const firestore = require('../services/firestoreService');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const dns = require('dns');
const router = express.Router();

// Initialize Resend if key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Force IPv4 for Render compatibility (fixes ENETUNREACH on IPv6 for SMTP backup)
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

// Mailer configuration using SMTP / Gmail (Backup/Local)
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return null;
};

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const isDemoAccount = ['instructor@university.edu', 'student1@university.edu'].includes(email);
  const otp = isDemoAccount ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  
  otpCache.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  // 1. Try Resend First (Best for Production/Render)
  if (resend) {
    try {
      console.log(`[OTP] Sending via Resend API to ${email}...`);
      await resend.emails.send({
        from: 'Exam Portal <onboarding@resend.dev>', // You can change this once you verify a domain
        to: email,
        subject: 'Your Exam Portal OTP',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Exam Portal Security</h2>
            <p>Your One-Time Password to log in is:</p>
            <h1 style="color: #4285F4; tracking: 2px;">${otp}</h1>
            <p style="color: #666; font-size: 12px;">This code will expire in 5 minutes.</p>
          </div>
        `
      });
      console.log(`[OTP] Success via Resend!`);
      return res.json({ message: 'OTP sent successfully.' });
    } catch (err) {
      console.error(`[OTP] Resend Error:`, err.message);
    }
  }

  // 2. Try Nodemailer Backup (Good for Localhost)
  const transporter = createTransporter();
  if (transporter) {
    try {
      console.log(`[OTP] Falling back to SMTP...`);
      await transporter.sendMail({
        from: `"Exam Portal Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Exam Portal OTP',
        html: `<strong>${otp}</strong>`
      });
      console.log(`[OTP] Success via SMTP!`);
    } catch (err) {
      console.error(`[OTP] SMTP Error:`, err.message);
      console.log(`[EMERGENCY] Here is your OTP: ${otp}`);
    }
  } else {
    console.log(`[EMERGENCY] No mailer config! Here is your OTP: ${otp}`);
  }

  res.json({ message: 'OTP processed.' });
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
