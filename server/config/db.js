const mongoose = require('mongoose');
let mongod = null;

const connectDB = async () => {
  try {
    let connStr = process.env.MONGO_URI;
    
    if (!connStr) {
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
    
    await mongoose.connect(connStr);
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
  } catch (err) {
    console.error(`Error disconnecting from MongoDB: ${err.message}`);
  }
};

module.exports = connectDB;
