const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many requests, please try again later.' }
});

module.exports = { loginLimiter };
