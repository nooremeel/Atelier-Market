/**
 * @file server.js
 * @description Local development and standalone server entry point.
 *              Connects to the database via cached singleton, optionally provisions
 *              demo data when DEMO_MODE=true, mounts app.js, and begins listening.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectToDatabase = require('./util/db');
const { seedDemoData } = require('./scripts/seedDemoData');

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  console.log('[DB] Connecting to MongoDB Atlas...');
  await connectToDatabase();
  console.log('[DB] MongoDB connected successfully.');

  if (process.env.DEMO_MODE === 'true') {
    console.log('[Demo] DEMO_MODE enabled — bootstrapping and resetting demo seed data...');
    await seedDemoData();
  } else {
    console.log('[Server] DEMO_MODE is not enabled — skipping demo seeds and account reset.');
  }

  const server = app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(` ✨  ATELIER MARKET  —  Multi-Seller Craft Marketplace`);
    console.log(`========================================================`);
    console.log(` 🌐  http://localhost:${PORT}`);
    if (process.env.DEMO_MODE === 'true') {
      console.log(`\n 👤  Artisan Seller (password: Demo1234!):`);
      console.log(`     layla@ateliermarket.com  — Al-Rashidi Ceramics (Bahrain)`);
      console.log(`     omar@ateliermarket.com   — Khalil Bindery (Cairo)`);
      console.log(`     nour@ateliermarket.com   — Beit Al-Nour Glass (Beirut)`);
      console.log(`     tariq@ateliermarket.com  — Atelier Saud Metals (Riyadh)`);
      console.log(`\n 🛍️  Customer Accounts (password: Demo1234!):`);
      console.log(`     sara@example.com  · james@example.com  · aisha@example.com`);
      console.log(`\n 👑  Platform Admin (password: Demo1234!):`);
      console.log(`     admin@ateliermarket.com  — Admin Director`);
      console.log(`\n 🔑  Legacy Demo:  demo@atelier.com / Atelier123!`);
    }
    console.log(`========================================================\n`);
  });

  const shutdown = async () => {
    console.log('\nGracefully shutting down...');
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Error] Server startup failed:', err);
  process.exit(1);
});
