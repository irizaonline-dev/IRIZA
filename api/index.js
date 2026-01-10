const serverless = require('serverless-http');
const connectDB = require('../config/db');
const app = require('../app');

// Connect DB once (serverless friendly connection handled in helper)
connectDB().catch(err => console.error('DB connect error', err));

module.exports = serverless(app);
