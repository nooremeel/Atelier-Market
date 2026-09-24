require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Seller Identities ────────────────────────────────────────────────────────
const SELLERS = [
  {
    name:  'Layla Al-Rashidi',
    email: 'layla@ateliermarket.com',
    role:  'seller',
    avatar: '',
    sellerProfile: {
      shopName:        'Al-Rashidi Ceramics',
      shopDescription: 'Third-generation ceramicist from the Gulf. Every piece is wheel-thrown by hand, glazed with local mineral pigments, and fired in a wood kiln.',
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
    },
  },
  {
    name:  'Omar Khalil',
    email: 'omar@ateliermarket.com',
    role:  'seller',
    avatar: '',
    sellerProfile: {
      shopName:        'Khalil Bindery',
      shopDescription: 'Bookbinder and leather craftsman based in Cairo. Combining Islamic geometric ornamentation with Swiss binding techniques since 2011.',
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    },
  },
  {
    name:  'Nour Mansour',
    email: 'nour@ateliermarket.com',
    role:  'seller',
    avatar: '',
    sellerProfile: {
      shopName:        'Beit Al-Nour Glass',
      shopDescription: 'Mouth-blown glassware workshop in the Levant tradition. Designs inspired by Damascene architecture and Ottoman-era apothecary vessels.',
      location: { city: 'Beirut', country: 'Lebanon', lat: 33.8886, lng: 35.4955 },
    },
  },
  {
    name:  'Tariq Al-Saud',
    email: 'tariq@ateliermarket.com',
    role:  'seller',
    avatar: '',
    sellerProfile: {
      shopName:        'Atelier Saud Metals',
      shopDescription: 'Fine metalwork studio in Riyadh. Copper, brass, and bronze objects made using traditional Najdi repousse and chasing techniques.',
      location: { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
    },
  },
];

// ─── Admin Identity ──────────────────────────────────────────────────────────
const ADMIN = {
  name:  'Admin Director',
  email: 'admin@ateliermarket.com',
  role:  'admin',
  avatar: '',
};

// ─── Customer Identities ─────────────────────────────────────────────────────
const CUSTOMERS = [
  { name: 'Sara Hassan',   email: 'sara@example.com' },
  { name: 'James Elliot',  email: 'james@example.com' },
  { name: 'Aisha Karimi',  email: 'aisha@example.com' },
];

// ─── Seed Users ──────────────────────────────────────────────────────────────
async function seedUsers() {
  const User = require('./models/user');
  const hash = (pw) => bcrypt.hash(pw, 10);
  const uids = {};

  // Admin
  let admin = await User.findOne({ email: ADMIN.email });
  if (!admin) {
    admin = new User({ ...ADMIN, password: await hash('Demo1234!'), cart: { items: [] } });
    await admin.save();
    console.log(`[Seed] Created admin: ${ADMIN.email}`);
  } else {
    let changed = false;
    if (admin.role !== 'admin') { admin.role = 'admin'; changed = true; }
    const match = await bcrypt.compare('Demo1234!', admin.password);
    if (!match) { admin.password = await hash('Demo1234!'); changed = true; }
    if (changed) await admin.save();
  }
  uids[ADMIN.email] = admin._id;

  // Sellers
  for (const s of SELLERS) {
    let u = await User.findOne({ email: s.email });
    if (!u) {
      u = new User({ ...s, password: await hash('Demo1234!'), cart: { items: [] } });
      await u.save();
      console.log(`[Seed] Created seller: ${s.email}`);
    } else {
      const match = await bcrypt.compare('Demo1234!', u.password);
      if (!match) {
        u.password = await hash('Demo1234!');
        await u.save();
      }
    }
    uids[s.email] = u._id;
  }

  // Customers
  for (const c of CUSTOMERS) {
    let u = await User.findOne({ email: c.email });
    if (!u) {
      u = new User({ ...c, role: 'customer', password: await hash('Demo1234!'), cart: { items: [] } });
      await u.save();
      console.log(`[Seed] Created customer: ${c.email}`);
    } else {
      const match = await bcrypt.compare('Demo1234!', u.password);
      if (!match) {
        u.password = await hash('Demo1234!');
        await u.save();
      }
    }
    uids[c.email] = u._id;
  }

  // Legacy demo user (backwards compat)
  let demo = await User.findOne({ email: 'demo@atelier.com' });
  if (!demo) {
    demo = new User({
      name: 'Demo User', email: 'demo@atelier.com', role: 'customer',
      password: await hash('Atelier123!'), cart: { items: [] },
    });
    await demo.save();
    console.log('[Seed] Created legacy demo user: demo@atelier.com / Atelier123!');
  }
  uids['demo@atelier.com'] = demo._id;

  return uids;
}

// ─── Seed Products ────────────────────────────────────────────────────────────
async function seedProducts(uids) {
  const Product = require('./models/product');

  // Backfill createdAt for any products missing timestamps (e.g. legacy products)
  const missingTimestamps = await Product.find({ createdAt: { $exists: false } });
  for (const doc of missingTimestamps) {
    const timestamp = doc._id && doc._id.getTimestamp ? doc._id.getTimestamp() : new Date();
    await Product.updateOne({ _id: doc._id }, { $set: { createdAt: timestamp, updatedAt: timestamp } });
  }

  // Ensure ratings structure exists on all products
  await Product.updateMany(
    { 'ratings.average': { $exists: false } },
    { $set: { ratings: { average: 0, count: 0 } } }
  );

  // Ensure stock fields exist on all products
  await Product.updateMany(
    { stock: { $exists: false } },
    { $set: { stock: 20, lowStockThreshold: 5, isAvailable: true } }
  );

  const laylaId  = uids['layla@ateliermarket.com'];
  const omarId   = uids['omar@ateliermarket.com'];
  const nourId   = uids['nour@ateliermarket.com'];
  const tariqId  = uids['tariq@ateliermarket.com'];

  const items = [
    // ── Al-Rashidi Ceramics ──
    {
      title: 'Artisanal Ceramic Vessel',
      price: 185, compareAtPrice: null,
      description: 'Wheel-thrown stoneware featuring an organic matte chalk glaze. Sourced from the historic Mino province.',
      imageUrl: 'images/products/artisanal-ceramic-vessel.jpg',
      category: 'ceramics', badge: 'bestseller',
      tags: ['handmade', 'stoneware', 'glaze', 'vessel'],
      stock: 12,
      ratings: { average: 4.8, count: 34 },
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
      userId: laylaId,
    },
    {
      title: 'Brushed Champagne Tea Set',
      price: 310, compareAtPrice: null,
      description: 'Hand-spun copper teapot with brushed tin interior and steam-bent walnut handle. Glazed in a soft dusty rose with gold leaf accents.',
      imageUrl: 'images/products/brushed-champagne-tea-set.jpg',
      category: 'ceramics', badge: 'limited',
      tags: ['tea', 'copper', 'handmade', 'luxury'],
      stock: 4,
      ratings: { average: 4.9, count: 11 },
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
      userId: laylaId,
    },
    {
      title: 'Wabi-Sabi Bowl — Rust & Ash',
      price: 95, compareAtPrice: 130,
      description: 'A pinch-thrown bowl in iron-red with white ash drip glaze. Embraces the Japanese philosophy of beauty in imperfection.',
      imageUrl: 'images/products/wabi-sabi-bowl.jpg',
      category: 'ceramics', badge: 'sale',
      tags: ['bowl', 'wabi-sabi', 'rustic', 'iron red'],
      stock: 7,
      ratings: { average: 4.6, count: 18 },
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
      userId: laylaId,
    },

    // ── Khalil Bindery ──
    {
      title: 'Monolithic Marble Bookends',
      price: 240, compareAtPrice: null,
      description: 'Pair of solid Nero Marquina marble blocks with hand-honed bevels and subtle natural veining.',
      imageUrl: 'images/products/monolithic-marble-bookends.jpg',
      category: 'books', badge: 'bestseller',
      tags: ['marble', 'bookends', 'minimalist', 'desk'],
      stock: 9,
      ratings: { average: 4.7, count: 22 },
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      userId: omarId,
    },
    {
      title: 'Architectural Leather Journal',
      price: 95, compareAtPrice: null,
      description: 'Full-grain vegetable-tanned bridle leather with Smyth-sewn archival cotton paper leaves. 200 pages, A5.',
      imageUrl: 'images/products/architectural-leather-journal.jpg',
      category: 'leather', badge: 'new',
      tags: ['journal', 'leather', 'handmade', 'stationery'],
      stock: 25,
      ratings: { average: 4.9, count: 41 },
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      userId: omarId,
    },
    {
      title: 'Bespoke Clothbound Monograph',
      price: 120, compareAtPrice: null,
      description: 'Limited collector edition bound in natural Belgian linen with foil-stamped typography. Edition of 250.',
      imageUrl: 'images/products/bespoke-clothbound-monograph.jpg',
      category: 'books', badge: 'limited',
      tags: ['book', 'linen', 'collector', 'foil stamped'],
      stock: 18,
      ratings: { average: 4.8, count: 29 },
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      userId: omarId,
    },
    {
      title: 'Atelier Archival Edition Vol. I',
      price: 145, compareAtPrice: null,
      description: 'Curated retrospective of architectural works printed on Japanese bamboo wove paper. Hand-bound in quarter-leather.',
      imageUrl: 'images/products/atelier-archival-edition.jpg',
      category: 'books', badge: '',
      tags: ['architecture', 'archival', 'bamboo paper', 'quarter leather'],
      stock: 14,
      ratings: { average: 4.5, count: 16 },
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      userId: omarId,
    },
    {
      title: 'Calligraphers Writing Case',
      price: 175, compareAtPrice: null,
      description: 'Tan full-grain leather roll holding eight reed pens and a small inkwell. Hand-stitched with waxed linen thread.',
      imageUrl: 'images/products/calligraphers-writing-case.jpg',
      category: 'leather', badge: 'new',
      tags: ['calligraphy', 'leather', 'pen case', 'writing'],
      stock: 8,
      ratings: { average: 4.7, count: 9 },
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      userId: omarId,
    },

    // ── Beit Al-Nour Glass ──
    {
      title: 'Obsidian Brew Carafe',
      price: 160, compareAtPrice: null,
      description: 'Borosilicate double-walled vessel paired with a spun brass filter sleeve for ceremonial extraction.',
      imageUrl: 'images/products/obsidian-brew-carafe.jpg',
      category: 'glass', badge: 'bestseller',
      tags: ['carafe', 'borosilicate', 'coffee', 'pour-over'],
      stock: 20,
      ratings: { average: 4.8, count: 57 },
      location: { city: 'Beirut', country: 'Lebanon', lat: 33.8886, lng: 35.4955 },
      userId: nourId,
    },
    {
      title: 'Minimalist Amber Glass Flagon',
      price: 85, compareAtPrice: 110,
      description: 'Mouth-blown apothecary bottle with ground-glass stopper and tactile linen tag. Perfect for olive oil, bitters, or perfume.',
      imageUrl: 'images/products/minimalist-amber-glass-flagon.jpg',
      category: 'glass', badge: 'sale',
      tags: ['apothecary', 'amber', 'bottle', 'mouth-blown'],
      stock: 30,
      ratings: { average: 4.4, count: 38 },
      location: { city: 'Beirut', country: 'Lebanon', lat: 33.8886, lng: 35.4955 },
      userId: nourId,
    },
    {
      title: 'Damascus Window Lantern',
      price: 220, compareAtPrice: null,
      description: 'Geometric star-pattern lantern in hand-blown cobalt glass set in a hand-forged iron frame. Based on 14th-century mashrabiya motifs.',
      imageUrl: 'images/products/damascus-window-lantern.jpg',
      category: 'glass', badge: 'new',
      tags: ['lantern', 'cobalt', 'mashrabiya', 'islamic geometry'],
      stock: 6,
      ratings: { average: 4.9, count: 13 },
      location: { city: 'Beirut', country: 'Lebanon', lat: 33.8886, lng: 35.4955 },
      userId: nourId,
    },
    {
      title: 'Pressed Wildflower Votive Set',
      price: 65, compareAtPrice: null,
      description: 'Set of three hand-pressed glass votive holders, each with a dried wildflower inclusion. No two are identical.',
      imageUrl: 'images/products/pressed-wildflower-votive-set.jpg',
      category: 'glass', badge: '',
      tags: ['votive', 'wildflower', 'set of three', 'candle'],
      stock: 42,
      ratings: { average: 4.6, count: 61 },
      location: { city: 'Beirut', country: 'Lebanon', lat: 33.8886, lng: 35.4955 },
      userId: nourId,
    },

    // ── Atelier Saud Metals ──
    {
      title: 'Najdi Repousse Tray',
      price: 380, compareAtPrice: null,
      description: 'Copper tray with hand-repousse geometric border inspired by Najdi door ornamentation. Tin-lined interior, silver-plated handle.',
      imageUrl: 'images/products/najdi-repousse-tray.jpg',
      category: 'metals', badge: 'limited',
      tags: ['copper', 'repousse', 'najdi', 'tray', 'traditional'],
      stock: 3,
      ratings: { average: 5.0, count: 7 },
      location: { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
      userId: tariqId,
    },
    {
      title: 'Brass Incense Burner — Star Form',
      price: 195, compareAtPrice: null,
      description: 'Six-pointed star mabkhara in spun and chased brass. The pierced lid releases aromatic smoke in geometric patterns.',
      imageUrl: 'images/products/brass-incense-burner.jpg',
      category: 'metals', badge: 'bestseller',
      tags: ['incense', 'brass', 'mabkhara', 'oud', 'burner'],
      stock: 15,
      ratings: { average: 4.9, count: 44 },
      location: { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
      userId: tariqId,
    },
    {
      title: 'Dallah Coffee Pot — Heirloom Edition',
      price: 560, compareAtPrice: null,
      description: 'Traditional Arabian dallah in heavy-gauge brass with hand-engraved floral arabesques and a spout shaped as a bird beak. Signed.',
      imageUrl: 'images/products/dallah-coffee-pot.jpg',
      category: 'metals', badge: 'limited',
      tags: ['dallah', 'coffee pot', 'brass', 'arabesque', 'signed'],
      stock: 2,
      ratings: { average: 5.0, count: 3 },
      location: { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
      userId: tariqId,
    },
    {
      title: 'Copper Hammam Bowl',
      price: 135, compareAtPrice: 160,
      description: 'Hand-hammered copper bowl used in traditional hammam rituals. 20cm diameter with a rolled rim and a satin patina finish.',
      imageUrl: 'images/products/copper-hammam-bowl.jpg',
      category: 'metals', badge: 'sale',
      tags: ['hammam', 'copper', 'bath', 'spa', 'hammered'],
      stock: 11,
      ratings: { average: 4.7, count: 19 },
      location: { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
      userId: tariqId,
    },

    // ── Paper & Textiles ──
    {
      title: 'Marbled Florentine Notebook',
      price: 48, compareAtPrice: null,
      description: 'Hand-marbled endpapers in the Venetian tradition, bound in a paste-paper cover. 160 cream-laid pages, A5, ribbon bookmark.',
      imageUrl: 'images/products/marbled-florentine-notebook.jpg',
      category: 'paper', badge: 'new',
      tags: ['notebook', 'marbled', 'florentine', 'stationery'],
      stock: 50,
      ratings: { average: 4.6, count: 72 },
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      userId: omarId,
    },
    {
      title: 'Ikat Silk Table Runner',
      price: 290, compareAtPrice: null,
      description: 'Hand-woven Uzbek ikat silk in deep indigo, saffron and ivory. 40 × 200cm. Each runner is unique — a fragment of living textile heritage.',
      imageUrl: 'images/products/ikat-silk-table-runner.jpg',
      category: 'textiles', badge: '',
      tags: ['ikat', 'silk', 'uzbek', 'table runner', 'woven'],
      stock: 8,
      ratings: { average: 4.8, count: 14 },
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
      userId: laylaId,
    },
    {
      title: 'Organic Linen Cushion — Desert Sand',
      price: 115, compareAtPrice: null,
      description: 'Stone-washed European linen with a handwoven diamond grid in natural undyed thread. 50 × 50cm with a feather insert.',
      imageUrl: 'images/products/organic-linen-cushion.jpg',
      category: 'textiles', badge: '',
      tags: ['linen', 'cushion', 'natural', 'organic', 'woven'],
      stock: 22,
      ratings: { average: 4.5, count: 33 },
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
      userId: laylaId,
    },
  ];

  let seededCount = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const exists = await Product.findOne({ title: item.title });
    if (!exists) {
      const createdAt = new Date(Date.now() - (items.length - i) * 3600000);
      await Product.create({
        ...item,
        createdAt,
        updatedAt: createdAt,
      });
      seededCount++;
    } else if (exists.imageUrl !== item.imageUrl) {
      exists.imageUrl = item.imageUrl;
      await exists.save();
    }
  }
  if (seededCount > 0) {
    console.log(`[Seed] Seeded ${seededCount} marketplace products with staggered timestamps.`);
  }
}

// ─── Seed Reviews ─────────────────────────────────────────────────────────────
async function seedReviews(uids) {
  const Review  = require('./models/review');
  const Product = require('./models/product');
  const count = await Review.countDocuments();
  if (count > 0) return;

  const products = await Product.find({}).lean();
  const saraId  = uids['sara@example.com'];
  const jamesId = uids['james@example.com'];
  const aishaId = uids['aisha@example.com'];

  const sampleReviews = [
    { rating: 5, title: 'Exceptional craftsmanship', body: 'I was genuinely moved when I unwrapped this. The weight and texture are unlike anything from a mass-market store. My guests ask about it every time.' },
    { rating: 5, title: 'Worth every dirham', body: 'I deliberated for weeks before purchasing and I regret nothing. Ships quickly, arrives perfectly packaged in tissue paper and a handwritten card.' },
    { rating: 4, title: 'Beautiful, with one small note', body: 'The object itself is gorgeous — the photography on the site actually undersells it. I knocked one star only because delivery took longer than expected.' },
    { rating: 5, title: 'A piece I will keep forever', body: 'This is the kind of thing you leave to your children. Bought it for my home office and it has become the single object everyone notices.' },
    { rating: 4, title: 'Authentic and distinctive', body: 'You can feel the hand of the maker in every detail. Nothing is perfectly symmetrical and that is precisely the point. True craft, not a factory copy.' },
    { rating: 5, title: 'Gift that landed perfectly', body: 'Bought as a wedding gift. The couple were overwhelmed — they said they had never received something that felt so considered. Packed beautifully.' },
    { rating: 3, title: 'Good but not quite what I expected', body: 'The colour in person reads slightly more muted than in the photos. Still a quality piece, but I wanted to mention it for accurate expectations.' },
    { rating: 5, title: 'My favourite purchase this year', body: 'This has pride of place on my shelf. The seller was also incredibly kind about answering my questions before I bought. Rare customer service.' },
  ];

  const reviewDocs = [];
  const used = new Set();

  for (const product of products.slice(0, 12)) {
    const reviewers = [saraId, jamesId, aishaId];
    for (const userId of reviewers) {
      const key = `${product._id}-${userId}`;
      if (used.has(key)) continue;
      used.add(key);
      const r = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
      reviewDocs.push({
        productId: product._id,
        userId,
        rating:   r.rating,
        title:    r.title,
        body:     r.body,
        verified: true,
      });
    }
  }

  if (reviewDocs.length) {
    await Review.insertMany(reviewDocs, { ordered: false });
    console.log(`[Seed] Seeded ${reviewDocs.length} reviews.`);
  }
}

// ─── Seed Orders ──────────────────────────────────────────────────────────────
async function seedOrders(uids) {
  const Order   = require('./models/order');
  const Product = require('./models/product');
  const count = await Order.countDocuments();
  if (count > 0) return;

  const products = await Product.find({}).lean();
  const saraId  = uids['sara@example.com'];
  const jamesId = uids['james@example.com'];
  const aishaId = uids['aisha@example.com'];

  const orders = [
    {
      user:  { email: 'sara@example.com',  userId: saraId,  name: 'Sara Hassan' },
      products: [
        { productData: products[0], quantity: 1 },
        { productData: products[4], quantity: 2 },
      ],
      totalPrice: products[0].price + products[4].price * 2,
      status: 'delivered', paymentStatus: 'paid',
      shippingAddress: { name: 'Sara Hassan', street: '12 Al Fateh Avenue', city: 'Manama', country: 'Bahrain', postalCode: '316' },
      trackingNumber: 'BH-2026-00142',
    },
    {
      user:  { email: 'james@example.com', userId: jamesId, name: 'James Elliot' },
      products: [
        { productData: products[8], quantity: 1 },
      ],
      totalPrice: products[8].price,
      status: 'shipped', paymentStatus: 'paid',
      shippingAddress: { name: 'James Elliot', street: '47 Westbourne Grove', city: 'London', country: 'United Kingdom', postalCode: 'W11 2SE' },
      trackingNumber: 'UK-2026-08871',
    },
    {
      user:  { email: 'aisha@example.com', userId: aishaId, name: 'Aisha Karimi' },
      products: [
        { productData: products[13], quantity: 1 },
        { productData: products[14], quantity: 1 },
      ],
      totalPrice: products[13].price + products[14].price,
      status: 'confirmed', paymentStatus: 'paid',
      shippingAddress: { name: 'Aisha Karimi', street: 'Al Olaya District, Block 7', city: 'Riyadh', country: 'Saudi Arabia', postalCode: '12213' },
    },
    {
      user:  { email: 'sara@example.com', userId: saraId, name: 'Sara Hassan' },
      products: [
        { productData: products[16], quantity: 1 },
      ],
      totalPrice: products[16].price,
      status: 'pending', paymentStatus: 'paid',
      shippingAddress: { name: 'Sara Hassan', street: '12 Al Fateh Avenue', city: 'Manama', country: 'Bahrain', postalCode: '316' },
    },
  ];

  await Order.insertMany(orders);
  console.log(`[Seed] Seeded ${orders.length} sample orders.`);
}

async function seedDiscounts() {
  const Discount = require('./models/discount');
  const discounts = [
    {
      code: 'WELCOME10',
      description: '10% off your purchase at Atelier Market',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      isActive: true,
    },
    {
      code: 'HERITAGE15',
      description: '15% off orders over $100 across Gulf & Levant ateliers',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 100,
      isActive: true,
    },
    {
      code: 'CRAFT20',
      description: '$20 off handcrafted masterworks on orders over $120',
      discountType: 'fixed',
      discountValue: 20,
      minOrderAmount: 120,
      isActive: true,
    },
  ];

  for (const d of discounts) {
    const exists = await Discount.findOne({ code: d.code });
    if (!exists) {
      await Discount.create(d);
    }
  }
  console.log('[Seed] Sample promo codes verified/seeded.');
}

async function backfillOrderTracking() {
  const Order = require('./models/order');
  try {
    const orders = await Order.find({
      $or: [
        { timeline: { $exists: false } },
        { timeline: { $size: 0 } },
        { carrier: { $exists: false } },
        { estimatedDeliveryDate: { $exists: false } },
      ],
    });

    for (const order of orders) {
      const updateFields = {};
      const carrier = order.carrier || 'Aramex White-Glove Express';
      if (!order.carrier) {
        updateFields.carrier = carrier;
      }
      if (!order.estimatedDeliveryDate) {
        const est = new Date(order.createdAt || Date.now());
        est.setDate(est.getDate() + 5);
        updateFields.estimatedDeliveryDate = est;
      }
      if (!order.timeline || order.timeline.length === 0) {
        const baseTime = order.createdAt ? new Date(order.createdAt) : new Date();
        const timeline = [
          {
            status: 'confirmed',
            timestamp: baseTime,
            note: 'Order confirmed and payment secured via encrypted vault.',
          },
        ];

        if (['crafting', 'shipped', 'delivered'].includes(order.status)) {
          const craftingTime = new Date(baseTime);
          craftingTime.setHours(craftingTime.getHours() + 12);
          timeline.push({
            status: 'crafting',
            timestamp: craftingTime,
            note: 'Artisan commenced handcrafting in the studio workshop.',
          });
        }

        if (['shipped', 'delivered'].includes(order.status)) {
          const shippedTime = new Date(baseTime);
          shippedTime.setDate(shippedTime.getDate() + 2);
          timeline.push({
            status: 'shipped',
            timestamp: shippedTime,
            note: `Package dispatched with ${carrier}${order.trackingNumber ? ` (${order.trackingNumber})` : ''}.`,
          });
        }

        if (order.status === 'delivered') {
          const deliveredTime = new Date(baseTime);
          deliveredTime.setDate(deliveredTime.getDate() + 5);
          timeline.push({
            status: 'delivered',
            timestamp: deliveredTime,
            note: 'Delivered securely to patron address.',
          });
        }

        if (order.status === 'cancelled') {
          timeline.push({
            status: 'cancelled',
            timestamp: new Date(baseTime.getTime() + 3600000),
            note: 'Order cancelled by customer or atelier.',
          });
        }

        updateFields.timeline = timeline;
      }

      if (Object.keys(updateFields).length > 0) {
        await Order.updateOne({ _id: order._id }, { $set: updateFields });
      }
    }
    if (orders.length > 0) {
      console.log(`[Migration] Backfilled tracking & timeline for ${orders.length} orders.`);
    }
  } catch (err) {
    console.error('[Migration] Order backfill notice:', err.message);
  }
}

async function backfillProductVariants() {
  const Product = require('./models/product');
  try {
    const vessel = await Product.findOne({ title: 'Artisanal Ceramic Vessel' });
    if (vessel && (!vessel.variants || vessel.variants.length === 0)) {
      vessel.variants = [
        { name: 'Studio Edition (250 ml)', sku: 'ACV-250', price: 185, compareAtPrice: null, stock: 8 },
        { name: 'Grand Atelier (500 ml)', sku: 'ACV-500', price: 265, compareAtPrice: 295, stock: 5 },
        { name: 'Collector’s Magnum (1000 ml)', sku: 'ACV-1000', price: 420, compareAtPrice: null, stock: 2 },
      ];
      vessel.stock = vessel.variants.reduce((sum, v) => sum + v.stock, 0);
      await vessel.save();
      console.log('[Migration] Backfilled variants for Artisanal Ceramic Vessel.');
    }

    const journal = await Product.findOne({ title: 'Architectural Leather Journal' });
    if (journal && (!journal.variants || journal.variants.length === 0)) {
      journal.variants = [
        { name: 'Pocket / A6', sku: 'ALJ-A6', price: 68, compareAtPrice: null, stock: 14 },
        { name: 'Studio / A5', sku: 'ALJ-A5', price: 95, compareAtPrice: null, stock: 10 },
        { name: 'Master Folio / A4', sku: 'ALJ-A4', price: 148, compareAtPrice: 165, stock: 4 },
      ];
      journal.stock = journal.variants.reduce((sum, v) => sum + v.stock, 0);
      await journal.save();
      console.log('[Migration] Backfilled variants for Architectural Leather Journal.');
    }

    const teaSet = await Product.findOne({ title: 'Brushed Champagne Tea Set' });
    if (teaSet && (!teaSet.variants || teaSet.variants.length === 0)) {
      teaSet.variants = [
        { name: '2-Piece Solo Service', sku: 'BCT-2P', price: 160, compareAtPrice: null, stock: 6 },
        { name: '4-Piece Salon Set', sku: 'BCT-4P', price: 290, compareAtPrice: 320, stock: 4 },
        { name: '6-Piece Grand Banquet', sku: 'BCT-6P', price: 410, compareAtPrice: null, stock: 2 },
      ];
      teaSet.stock = teaSet.variants.reduce((sum, v) => sum + v.stock, 0);
      await teaSet.save();
      console.log('[Migration] Backfilled variants for Brushed Champagne Tea Set.');
    }

    const carafe = await Product.findOne({ title: 'Obsidian Brew Carafe' });
    if (carafe && (!carafe.variants || carafe.variants.length === 0)) {
      carafe.variants = [
        { name: 'Standard (650 ml)', sku: 'OBC-650', price: 160, compareAtPrice: null, stock: 7 },
        { name: 'Grand Sommelier (1200 ml)', sku: 'OBC-1200', price: 235, compareAtPrice: 260, stock: 3 },
      ];
      carafe.stock = carafe.variants.reduce((sum, v) => sum + v.stock, 0);
      await carafe.save();
      console.log('[Migration] Backfilled variants for Obsidian Brew Carafe.');
    }
  } catch (err) {
    console.error('[Migration] Variant backfill notice:', err.message);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[DB] ERROR: MONGODB_URI is not set in .env — cannot start server.');
    process.exit(1);
  }

  console.log('[DB] Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('[DB] MongoDB connected successfully.');

  const uids = await seedUsers();
  await seedProducts(uids);
  await backfillProductVariants();
  await seedReviews(uids);
  await seedOrders(uids);
  await backfillOrderTracking();
  await seedDiscounts();

  const app  = require('./app');
  const PORT = process.env.PORT || 3001;

  const server = app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(` ✨  ATELIER MARKET  —  Multi-Seller Craft Marketplace`);
    console.log(`========================================================`);
    console.log(` 🌐  http://localhost:${PORT}`);
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
    console.log(`========================================================\n`);
  });

  const shutdown = async () => {
    console.log('\nGracefully shutting down...');
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('[Error] Server startup failed:', err);
  process.exit(1);
});
