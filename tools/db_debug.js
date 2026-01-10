// Simple DB debug helper. Loads .env and attempts to connect, printing helpful hints.
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('No MONGODB_URI / MONGO_URI found in environment. Create a .env or set env vars.');
  process.exit(2);
}

console.log('Attempting to connect to MongoDB (masked):', uri.replace(/:(?:[^:@\/]+)@/, ':*****@'));

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
    console.log('DB debug: connected OK');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('DB debug: failed to connect');
    if (err && err.message) console.error('Error message:', err.message);
    if (err && err.stack) console.error(err.stack.split('\n').slice(0,6).join('\n'));
    console.error('\nCommon fixes:');
    console.error('- Verify the Atlas DB user name and password are correct.');
    console.error('- Ensure your IP is whitelisted in Atlas Network Access (or 0.0.0.0/0 for testing).');
    console.error('- Confirm the connection string includes the correct cluster address and optional DB name.');
    console.error('- If using SRV string, ensure your environment has network access to SRV DNS resolution.');
    process.exit(3);
  }
})();
