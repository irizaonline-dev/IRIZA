const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
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
