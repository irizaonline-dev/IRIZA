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
    // Don't force a process exit here; log and allow the caller to handle retries.
    // In serverless deployments (Vercel) an uncaught exit can cause hard failures.
    // Re-throw so higher-level startup logic can decide (or just continue in degraded mode).
    throw err;
  }
};

module.exports = connectDB;
