const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

// GET /api/menu - public list
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/menu - admin
router.post('/', auth('admin'),
  body('title').notEmpty().withMessage('Title required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const body = req.body;
      const item = new MenuItem(body);
      await item.save();
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/menu/:id - admin
router.put('/:id', auth('admin'),
  body('title').optional().notEmpty().withMessage('Title required'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/menu/:id - admin
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
