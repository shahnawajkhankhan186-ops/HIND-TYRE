const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Resolve MongoDB URI with environment isolation (Dev, Test, Prod).
 * Guarantees automated tests and dev environments never touch production client data.
 */
function resolveMongoUri(rawUri) {
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

  if (isTest && process.env.MONGODB_TEST_URI) {
    return process.env.MONGODB_TEST_URI;
  }

  const baseUri =
    rawUri ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/hind_tyres_dev?replicaSet=rs0';

  try {
    const parsed = new URL(baseUri);
    const rawPath = (parsed.pathname || '').replace(/^\/+/, '');

    if (isTest) {
      // In test mode, always isolate into a test database
      const baseDbName = rawPath ? rawPath.replace(/_(test|dev|prod)$/i, '') : 'hind_tyres';
      parsed.pathname = `/${baseDbName}_test`;
      return parsed.href;
    }

    return parsed.href;
  } catch (err) {
    return baseUri;
  }
}

/**
 * Connect to MongoDB with caching for serverless/long-running environments.
 * Replica set is required for transactions.
 */
async function connectDB(rawUri) {
  const uri = resolveMongoUri(rawUri);

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      const envName = (process.env.NODE_ENV || 'development').toUpperCase();
      console.log(`[MongoDB] (${envName}) Connected to database: ${mongooseInstance.connection.name}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

// Reset cache if connection closes
mongoose.connection.on('disconnected', () => {
  cached.conn = null;
  cached.promise = null;
});

module.exports = { connectDB, resolveMongoUri };
