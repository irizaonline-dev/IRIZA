const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      res.json({ message: 'ok' });
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
      const payload = { id: user._id, email: user.email, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });
      res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
