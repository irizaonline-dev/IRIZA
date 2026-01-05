const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// POST /api/orders - create order (authenticated)
router.post('/', auth(), async (req, res) => {
  try {
    const payload = req.body;
    const orderId = `ORD-${Date.now()}`;
    const order = new Order({ ...payload, orderId, userId: req.user && req.user.id });
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders - list (admin) or user's orders
router.get('/', auth(), async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const all = await Order.find({}).sort({ createdAt: -1 });
      return res.json(all);
    }
    const mine = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(mine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', auth(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && String(order.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
