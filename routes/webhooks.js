const express = require('express');
const router = express.Router();
const Webhook = require('../models/Webhook');
const auth = require('../middleware/auth');

// List/create webhooks (admin)
router.get('/', auth('admin'), async (req, res) => {
  try {
    const list = await Webhook.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth('admin'), async (req, res) => {
  try {
    const wh = new Webhook({ ...req.body, createdBy: req.user.id });
    await wh.save();
    res.json(wh);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public receiver for provider webhooks
router.post('/receive', async (req, res) => {
  try {
    // For now, accept and log. Optionally dispatch to stored webhooks.
    console.log('Incoming webhook', req.headers, req.body);
    // Dispatch to registered webhooks (best-effort)
    const list = await Webhook.find({});
    if (list && list.length) {
      list.forEach(async (w) => {
        try {
          if (typeof globalThis.fetch === 'function') {
            await globalThis.fetch(w.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
          }
        } catch (e) {
          console.error('Webhook dispatch failed', e);
        }
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
