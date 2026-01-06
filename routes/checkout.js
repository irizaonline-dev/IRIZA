const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Checkout = require('../models/Checkout');
const auth = require('../middleware/auth');

// POST /api/checkout - create checkout record (public)
router.post('/',
  body('amount').isNumeric().withMessage('Amount required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const data = req.body;
      const c = new Checkout(data);
      await c.save();
      res.json(c);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/checkout - admin list
router.get('/', auth('admin'), async (req, res) => {
  try {
    const list = await Checkout.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/checkout/:id
router.get('/:id', auth('admin'), async (req, res) => {
  try {
    const item = await Checkout.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
