import mongoose from 'mongoose';

let isConnected = null;

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    const dbUri = process.env.MONGODB_URI;

    const options = {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      waitQueueTimeoutMS: 25000,
    };

    const db = await mongoose.connect(dbUri, options);
    isConnected = db.connection.readyState;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw new Error('Failed to connect mongoDB');
  }
};

export default connectDB;
