const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');

// Serve Admin static files through API after auth
router.get('/', auth('admin'), (req, res) => {
  res.json({ ok: true });
});

router.get('/*', auth('admin'), (req, res) => {
  try {
    const p = req.query.path || req.params[0] || '';
    // normalize and prevent path traversal
    const safe = path.normalize(p).replace(/^\.+\/,'');
    const filePath = path.join(process.cwd(), 'Admin', safe);
    if (!filePath.startsWith(path.join(process.cwd(), 'Admin'))) {
      return res.status(400).send('Invalid path');
    }
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    const ext = path.extname(filePath).toLowerCase();
    const map = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
    const type = map[ext] || 'application/octet-stream';
    res.type(type);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
