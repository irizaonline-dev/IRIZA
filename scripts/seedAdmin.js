require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seed() {
  await connectDB();
  const email = 'admin@test';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin already exists');
    process.exit(0);
  }
  const hash = await bcrypt.hash('password', 10);
  const u = new User({ email, passwordHash: hash, role: 'admin', name: 'Administrator' });
  await u.save();
  console.log('Admin user created:', email);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
