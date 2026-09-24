const mongoose = require('mongoose');

/**
 * Global connection cache for serverless environments.
 * Prevents multiple connections being created across warm lambda invocations.
 */
let cachedPromise = null;

async function connectToDatabase() {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, await the cached promise
  if (cachedPromise && mongoose.connection.readyState === 2) {
    await cachedPromise;
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || (
    process.env.MONGO_USER && process.env.MONGO_PASSWORD && process.env.MONGO_DEFAULT_DATABASE
      ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.etoo1jt.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?appName=shop`
      : null
  );

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  };

  cachedPromise = mongoose.connect(mongoUri, opts);

  try {
    await cachedPromise;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }

  return mongoose.connection;
}

module.exports = connectToDatabase;
