const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// beforeAll / afterAll / afterEach are provided as globals (vitest.config.mjs -> test.globals: true).
// vitest's ESM-only entry cannot be require()'d from a CommonJS setup file.

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // Vitest already sets NODE_ENV=test at startup (before app.js is required at
  // collection time); this line is kept only as an explicit intent marker.
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
