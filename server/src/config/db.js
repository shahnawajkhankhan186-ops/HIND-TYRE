require('dotenv').config();
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with caching for serverless/long-running environments.
 * Replica set is required for transactions.
 */
async function connectDB(uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hind_tyres?replicaSet=rs0') {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log(`[MongoDB] Connected to database: ${mongooseInstance.connection.name}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = { connectDB };
