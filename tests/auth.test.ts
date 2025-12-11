import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import User from '../src/models/User';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('auth', () => {
  it('registers and logs in a user', async () => {
    const email = 'test@example.com';
    const password = 'pass1234';

    const resReg = await request(app).post('/api/auth/register').send({ email, password }).expect(201);
    expect(resReg.body.token).toBeDefined();

    const resLogin = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    expect(resLogin.body.token).toBeDefined();

    // invalid login
    await request(app).post('/api/auth/login').send({ email, password: 'wrong' }).expect(401);
  });
});
