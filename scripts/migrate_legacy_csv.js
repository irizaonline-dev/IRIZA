/**
 * Simple CSV -> Mongo migrator.
 * Usage: node scripts/migrate_legacy_csv.js <type> <csvPath>
 * type: reservations|menu|orders
 */
require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const connectDB = require('../config/db');

async function parseCSV(path) {
  const rs = fs.createReadStream(path);
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
  const rows = [];
  for await (const line of rl) {
    if (!line) continue;
    // naive CSV split by comma
    rows.push(line.split(',').map(s => s.trim()));
  }
  return rows;
}

async function run() {
  const [, , type, csvPath] = process.argv;
  if (!type || !csvPath) {
    console.error('Usage: node scripts/migrate_legacy_csv.js <type> <csvPath>');
    process.exit(1);
  }
  await connectDB();
  const rows = await parseCSV(csvPath);
  const headers = rows.shift();
  const docs = rows.map(r => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = r[i] || '';
    return obj;
  });

  if (type === 'reservations') {
    const Reservation = require('../models/Reservation');
    const mapped = docs.map(d => ({
      name: d.name,
      email: d.email,
      phone: d.phone,
      partySize: Number(d.partySize) || 1,
      dateTime: new Date(d.dateTime),
      notes: d.notes
    }));
    await Reservation.insertMany(mapped);
    console.log('Inserted', mapped.length, 'reservations');
  } else if (type === 'menu') {
    const MenuItem = require('../models/MenuItem');
    await MenuItem.insertMany(docs);
    console.log('Inserted', docs.length, 'menu items');
  } else if (type === 'orders') {
    const Order = require('../models/Order');
    await Order.insertMany(docs);
    console.log('Inserted', docs.length, 'orders');
  } else {
    console.error('Unknown type', type);
    process.exit(2);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
