const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

const { loginLimiter } = require('./middleware/rateLimit');

// Mount routes
app.use('/api/auth', loginLimiter, require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/webhooks', require('./routes/webhooks'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

module.exports = app;
