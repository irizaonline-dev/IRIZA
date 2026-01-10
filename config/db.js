const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://Vercel-Admin-Irizadb:EGGBk9bx0OWpjm8n@irizadb.isvavni.mongodb.net/Irizadb?retryWrites=true&w=majority';

  // If a specific DB name is provided via env, and the URI doesn't contain one, append it.
  const providedDb = process.env.MONGODB_DB || process.env.MONGO_DB;
  try {
    const hasDbInUri = /\/[^\/?]+(\?|$)/.test(uri);
    if (providedDb && !hasDbInUri) {
      // If uri ends with a query string, insert before it
      const parts = uri.split('?');
      if (parts.length === 1) uri = `${uri}/${providedDb}`;
      else uri = `${parts[0]}/${providedDb}?${parts.slice(1).join('?')}`;
    }
  } catch (e) {
    // ignore URI parsing errors and try to connect with original URI
  }

  // In serverless environments (Vercel), avoid creating a new connection
  // on every invocation by reusing an existing mongoose connection if present.
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return;
  }

  // Mask URI when logging to avoid leaking credentials
  const masked = uri.replace(/:(?:[^:@\/]+)@/, ':*****@');
  console.log('Connecting to MongoDB URI:', masked);

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err && err.message ? err.message : err);
    // Provide friendly hints for common problems
    if (err && err.message && /bad auth|Authentication failed/i.test(err.message)) {
      console.error('Hint: MongoDB authentication failed. Verify the DB user/password and that the user has access to the target cluster.');
    }
    if (err && err.message && /ENOTFOUND|getaddrinfo|timed out/i.test(err.message)) {
      console.error('Hint: Network problem. Check Atlas cluster address, your network, and IP access list.');
    }
    throw err;
  }
};

module.exports = connectDB;
