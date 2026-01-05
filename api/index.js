const express = require('express');
const serverless = require('serverless-http');
const connectDB = require('../config/db');

const app = express();
app.use(express.json());

// Connect DB once
connectDB();

app.use('/api/auth', require('../routes/auth'));
app.use('/api/menu', require('../routes/menu'));
app.use('/api/orders', require('../routes/orders'));
app.use('/api/webhooks', require('../routes/webhooks'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

module.exports = serverless(app);
