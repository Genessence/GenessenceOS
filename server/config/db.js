const mongoose = require('mongoose');
let mongod = null;

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  try {
    let connStr = process.env.MONGO_URI;
    
    if (!connStr) {
      if (isProduction) {
        throw new Error('MONGO_URI environment variable is required in production but was not provided.');
      }
      console.log('No MONGO_URI environment variable detected in server/.env. Initializing in-memory MongoDB fallback...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        connStr = mongod.getUri();
        console.log(`In-memory MongoDB initialized at: ${connStr}`);
      } catch (memErr) {
        console.error(`Failed to load in-memory MongoDB: ${memErr.message}`);
        console.log('Defaulting to standard local MongoDB URI...');
        connStr = 'mongodb://127.0.0.1:27017/genessence';
      }
    } else {
      console.log(`Connecting to MongoDB using URI from .env: ${connStr.replace(/:([^@]+)@/, ':****@')}`);
    }
    
    const options = {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging (30s) if MongoDB is offline
      autoIndex: !isProduction, // Disable automatic index creation in production for performance
    };

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection lost. Attempting to reconnect...');
    });

    await mongoose.connect(connStr, options);
    console.log('MongoDB Connected Successfully.');
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('MongoDB connection closed gracefully.');
  } catch (err) {
    console.error(`Error disconnecting from MongoDB: ${err.message}`);
  }
};

// Handle process termination for graceful shutdown
const handleTermination = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down database connection...`);
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', () => handleTermination('SIGINT'));
process.on('SIGTERM', () => handleTermination('SIGTERM'));

module.exports = connectDB;
