import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/category';
dotenv.config();

const app = express();
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);

// basic health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

export default app;
