import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import User from '../src/models/User';
import Category from '../src/models/Category';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

let mongo: MongoMemoryServer;
let token: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  // create a user and token
  const user = new User({ email: 'a@b.com', password: 'password' });
  await user.save();
  token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await Category.deleteMany({});
});

describe('category', () => {
  it('creates categories and returns tree', async () => {
    const h = { Authorization: `Bearer ${token}` };

    const parentRes = await request(app).post('/api/category').set(h).send({ name: 'Electronics' }).expect(201);
    const parentId = parentRes.body._id;

    await request(app).post('/api/category').set(h).send({ name: 'Phones', parent: parentId }).expect(201);
    await request(app).post('/api/category').set(h).send({ name: 'Laptops', parent: parentId }).expect(201);

    const treeRes = await request(app).get('/api/category').set(h).expect(200);
    expect(treeRes.body.length).toBeGreaterThan(0);
    const electronics = treeRes.body.find((c: any) => c.name === 'Electronics');
    expect(electronics.children.length).toBe(2);
  });

  it('marks inactive cascades to descendants', async () => {
    const h = { Authorization: `Bearer ${token}` };

    const p = (await request(app).post('/api/category').set(h).send({ name: 'Root' })).body;
    const p1 = (await request(app).post('/api/category').set(h).send({ name: 'Child', parent: p._id })).body;
    const p2 = (await request(app).post('/api/category').set(h).send({ name: 'Grandchild', parent: p1._id })).body;

    // set parent inactive
    await request(app).put(`/api/category/${p._id}`).set(h).send({ status: 'inactive' }).expect(200);

    // verify all cascaded
    const g = await Category.findById(p2._id);
    expect(g?.status).toBe('inactive');
  });

  it('deletes category and reassigns children to parent', async () => {
    const h = { Authorization: `Bearer ${token}` };

    const root = (await request(app).post('/api/category').set(h).send({ name: 'Root' })).body;
    const child = (await request(app).post('/api/category').set(h).send({ name: 'Child', parent: root._id })).body;

    // delete root -> child's parent becomes null
    await request(app).delete(`/api/category/${root._id}`).set(h).expect(200);
    const c = await Category.findById(child._id);
    expect(c?.parent).toBeNull();
  });
});
