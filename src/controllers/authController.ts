import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET || 'secret';
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const user = new User({ email, password });
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
