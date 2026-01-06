const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/iriza';

  // In serverless environments (Vercel), avoid creating a new connection
  // on every invocation by reusing an existing mongoose connection if present.
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err);
    // In some deploy scenarios we prefer process exit so the service fails fast.
    process.exit(1);
  }
};

module.exports = connectDB;
