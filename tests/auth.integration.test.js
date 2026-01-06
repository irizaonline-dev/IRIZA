const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let mongod;

const wait = ms => new Promise(r => setTimeout(r, ms));

async function createWithRetries(attempts = 5, delay = 3000) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await MongoMemoryServer.create();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await wait(delay);
    }
  }
  throw lastErr;
}

beforeAll(async () => {
  mongod = await createWithRetries(6, 5000);
  process.env.MONGO_URI = mongod.getUri();
  // connect using app's helper
  const connectDB = require('../config/db');
  await connectDB();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('register and login flow', async () => {
  const app = require('../app');
  const agent = request(app);
  const email = 'inttest@example.com';
  const password = 'password123';

  // register
  const reg = await agent.post('/api/auth/register').send({ email, password, name: 'Integration' });
  expect(reg.status).toBe(200);

  // login
  const login = await agent.post('/api/auth/login').send({ email, password });
  expect(login.status).toBe(200);
  expect(login.body).toHaveProperty('token');
  expect(login.body.user.email).toBe(email);
});
