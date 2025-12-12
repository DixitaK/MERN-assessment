import mongoose from 'mongoose';
import app from './app';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern-category-api';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch(err => {
    console.error('Mongo connection error', err);
    process.exit(1);
  });
