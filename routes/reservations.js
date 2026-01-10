const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');

// GET /api/reservations - list (admin)
router.get('/', auth('admin'), async (req, res) => {
  try {
    const list = await Reservation.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reservations - create (public)
router.post('/',
  body('name').notEmpty().withMessage('Name required'),
  body('dateTime').notEmpty().withMessage('Date/time required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const data = req.body;
      const r = new Reservation(data);
      await r.save();
      res.json(r);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/reservations/:id
router.get('/:id', auth('admin'), async (req, res) => {
  try {
    const item = await Reservation.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reservations/:id - admin
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const item = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reservations/:id - admin
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
