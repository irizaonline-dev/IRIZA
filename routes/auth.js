const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function createAccessToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'changeme', { expiresIn: '1h' });
}

function createRefreshToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register',
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, password, name, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already registered' });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const user = new User({ email, passwordHash: hash, name, role });
      await user.save();
      // create tokens and set refresh cookie like login
      const token = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });
      const token = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      // Set httpOnly refresh token cookie
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/refresh -> issues new access token if refresh cookie valid
router.post('/refresh', async (req, res) => {
  try {
    const rt = req.cookies && req.cookies.refresh_token;
    if (!rt) return res.status(401).json({ message: 'No refresh token' });
    let payload;
    try {
      payload = jwt.verify(rt, process.env.JWT_SECRET || 'changeme');
    } catch (e) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    const token = createAccessToken(user);
    res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout -> clear refresh cookie
router.post('/logout', (req, res) => {
  res.clearCookie('refresh_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ ok: true });
});


// GET /api/auth/me -> return current user from access token
// (placed here to keep auth routes together)
router.get('/me', async (req, res) => {
  // this helper reads the Authorization header like middleware/auth.js
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: { email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
