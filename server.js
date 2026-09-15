const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedData(userId) {
  const Product = require('./models/product');
  const count = await Product.countDocuments();
  if (count === 0) {
    const items = [
      {
        title: 'Artisanal Ceramic Vessel',
        price: 185,
        description: 'Wheel-thrown stoneware featuring an organic matte chalk glaze. Sourced from the historic Mino province.',
        imageUrl: 'images/2026-06-08T13-16-19.276Z-Coffee.jpg',
        userId,
      },
      {
        title: 'Monolithic Marble Bookends',
        price: 240,
        description: 'Pair of solid Nero Marquina marble blocks with hand-honed bevels and subtle natural veining.',
        imageUrl: 'images/2026-06-07T13-23-12.945Z-BOOK.jpg',
        userId,
      },
      {
        title: 'Obsidian Brew Carafe',
        price: 160,
        description: 'Borosilicate double-walled vessel paired with a spun brass filter sleeve for ceremonial extraction.',
        imageUrl: 'images/2026-06-08T13-17-03.986Z-Juice.jpg',
        userId,
      },
      {
        title: 'Architectural Leather Journal',
        price: 95,
        description: 'Full-grain vegetable-tanned bridle leather with Smyth-sewn archival cotton paper leaves.',
        imageUrl: 'images/2026-06-08T13-20-00.058Z-book1.jpg',
        userId,
      },
      {
        title: 'Brushed Champagne Tea Set',
        price: 310,
        description: 'Hand-spun copper teapot with brushed tin interior and steam-bent walnut handle.',
        imageUrl: 'images/2026-06-08T13-16-19.276Z-Coffee.jpg',
        userId,
      },
      {
        title: 'Bespoke Clothbound Monograph',
        price: 120,
        description: 'Limited collector edition bound in natural Belgian linen with foil-stamped typography.',
        imageUrl: 'images/2026-06-07T13-29-33.745Z-BOOK2.jpg',
        userId,
      },
      {
        title: 'Minimalist Amber Glass Flagon',
        price: 85,
        description: 'Mouth-blown apothecary bottle with ground-glass stopper and tactile linen tag.',
        imageUrl: 'images/2026-06-08T13-17-03.986Z-Juice.jpg',
        userId,
      },
      {
        title: 'Atelier Archival Edition Vol. I',
        price: 145,
        description: 'Curated retrospective of architectural works printed on Japanese bamboo wove paper.',
        imageUrl: 'images/2026-06-08T12-03-44.967Z-BOOK.jpg',
        userId,
      },
    ];
    await Product.insertMany(items);
    console.log(`[Seed] Seeded ${items.length} luxury products.`);
  }
}

async function seedUser() {
  const User = require('./models/user');
  let user = await User.findOne({ email: 'demo@atelier.com' });
  if (!user) {
    const hashedPassword = await bcrypt.hash('Atelier123!', 12);
    user = new User({
      email: 'demo@atelier.com',
      password: hashedPassword,
      cart: { items: [] },
    });
    await user.save();
    console.log('[Seed] Created demo user: demo@atelier.com / Atelier123!');
  }
  return user._id;
}

(async () => {
  let memServer = null;
  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('[DB] Starting MongoMemoryServer for local execution...');
    memServer = await MongoMemoryServer.create({ instance: { dbName: 'shop' } });
    mongoUri = memServer.getUri();
  }

  console.log('[DB] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('[DB] MongoDB connected successfully.');

  const userId = await seedUser();
  await seedData(userId);

  const app = require('./app');
  const PORT = process.env.PORT || 3001;

  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` ✨ ATELIER NOIR - MINIMAL LUXURY SHOP IS RUNNING ✨`);
    console.log(`======================================================`);
    console.log(` 🌐 Web Application: http://localhost:${PORT}`);
    console.log(` 👤 Demo Account:    demo@atelier.com`);
    console.log(` 🔑 Demo Password:   Atelier123!`);
    console.log(`======================================================\n`);
  });

  const shutdown = async () => {
    console.log('\nGracefully shutting down...');
    server.close();
    await mongoose.disconnect();
    if (memServer) await memServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('[Error] Server startup failed:', err);
  process.exit(1);
});
