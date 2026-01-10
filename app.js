const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const { loginLimiter } = require('./middleware/rateLimit');

// Mount routes
app.use('/api/auth', loginLimiter, require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/checkout', require('./routes/checkout'));
// Protected admin proxy: serves files from Admin/ after auth
app.use('/api/admin', require('./routes/adminProxy'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

module.exports = app;
