const mongoose = require('mongoose');
let connectionPromise;

async function connectDB() {
  if (!process.env.MONGO_URI) {
    if (process.env.NODE_ENV !== 'production') console.warn('MONGO_URI is not set. Session history will be unavailable.');
    return false;
  }

  if (mongoose.connection.readyState === 1) return true;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('MongoDB connected.');
      return true;
    })
    .catch((error) => {
      console.error(`MongoDB connection failed: ${error.message}`);
      return false;
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  return connectionPromise;
}

module.exports = connectDB;