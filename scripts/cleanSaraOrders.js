require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

async function cleanAndSeedSaraOrders() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  // 1. Find Sara Hassan
  const sara = await User.findOne({ email: 'sara@example.com' });
  if (!sara) {
    console.error('Error: sara@example.com not found in database.');
    process.exit(1);
  }

  // 2. Fetch authentic catalog products
  const burner = await Product.findOne({ title: { $regex: /brass incense burner/i } }).lean() ||
                 await Product.findOne({ price: { $gte: 150 } }).lean();
  const flagon = await Product.findOne({ title: { $regex: /amber glass flagon/i } }).lean() ||
                 await Product.findOne({ price: { $lt: 100 } }).lean();
  const writingCase = await Product.findOne({ title: { $regex: /calligraphers writing case/i } }).lean() ||
                      await Product.findOne({ price: { $gte: 170 } }).lean();
  const tray = await Product.findOne({ title: { $regex: /najdi repousse tray/i } }).lean() ||
               await Product.findOne({ price: { $gte: 300 } }).lean();
  const bowl = await Product.findOne({ title: { $regex: /copper hammam bowl/i } }).lean() ||
               await Product.findOne({ price: { $gte: 120 } }).lean();

  if (!burner || !flagon || !writingCase || !tray || !bowl) {
    console.error('Error: Could not find required catalog products.');
    process.exit(1);
  }

  // 3. Remove all accumulated/orphaned orders for Sara
  const deleteResult = await Order.deleteMany({ 'user.email': 'sara@example.com' });
  console.log(`[Cleanup] Removed ${deleteResult.deletedCount} accumulated/test orders for sara@example.com.`);

  // 4. Reset Sara's cart so she has a fresh bag ready for live demos
  sara.cart = { items: [] };
  await sara.save();
  console.log(`[Cleanup] Cleared cart for sara@example.com.`);

  // 5. Build 3 pristine, showcase orders with rich delivery milestones
  const now = new Date();

  // Order 1: Crafting in Studio (Active in progress)
  const order1Date = new Date(now.getTime() - 4 * 3600 * 1000); // 4 hours ago
  const order1Estimated = new Date(now.getTime() + 4 * 24 * 3600 * 1000); // +4 days
  const order1Products = [
    { productData: burner, quantity: 1 },
    { productData: flagon, quantity: 1 },
  ];
  const order1Total = burner.price + flagon.price;

  const order1 = new Order({
    user: {
      email: 'sara@example.com',
      userId: sara._id,
      name: 'Sara Hassan',
    },
    products: order1Products,
    subtotal: order1Total,
    shippingFee: 0,
    discount: { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, amount: Math.round(order1Total * 0.1) },
    totalPrice: Math.round((order1Total * 0.9) * 100) / 100,
    status: 'crafting',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    paymentReference: 'PAYMOB-ORD-984120',
    shippingAddress: {
      name: 'Sara Hassan',
      street: '12 Al Fateh Avenue, Apt 4B',
      city: 'Manama',
      country: 'Bahrain',
      postalCode: '316',
    },
    carrier: 'Aramex White-Glove Express',
    trackingNumber: 'ARX-829104-BH',
    estimatedDeliveryDate: order1Estimated,
    timeline: [
      {
        status: 'confirmed',
        timestamp: order1Date,
        note: 'Order confirmed and payment authorized via Paymob Vault.',
      },
      {
        status: 'crafting',
        timestamp: new Date(now.getTime() - 1 * 3600 * 1000), // 1 hour ago
        note: 'Artisan studio has commenced hand-chiseling and mineral patina finishing.',
      },
    ],
    notes: 'Fragile heritage pieces — double foam and velvet pouch packaging requested.',
    createdAt: order1Date,
  });

  // Order 2: Shipped & In Transit (With tracking number)
  const order2Date = new Date(now.getTime() - 48 * 3600 * 1000); // 2 days ago
  const order2Estimated = new Date(now.getTime() + 24 * 3600 * 1000); // Tomorrow
  const order2Products = [
    { productData: writingCase, quantity: 1 },
  ];
  const order2Total = writingCase.price;

  const order2 = new Order({
    user: {
      email: 'sara@example.com',
      userId: sara._id,
      name: 'Sara Hassan',
    },
    products: order2Products,
    subtotal: order2Total,
    shippingFee: 0,
    discount: { code: '', discountType: '', discountValue: 0, amount: 0 },
    totalPrice: order2Total,
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    paymentReference: 'PAYMOB-ORD-871923',
    shippingAddress: {
      name: 'Sara Hassan',
      street: '12 Al Fateh Avenue, Apt 4B',
      city: 'Manama',
      country: 'Bahrain',
      postalCode: '316',
    },
    carrier: 'DHL Express Worldwide',
    trackingNumber: 'DHL-918234-BH',
    estimatedDeliveryDate: order2Estimated,
    timeline: [
      {
        status: 'confirmed',
        timestamp: order2Date,
        note: 'Order confirmed and payment authorized via Paymob Gateway.',
      },
      {
        status: 'crafting',
        timestamp: new Date(now.getTime() - 30 * 3600 * 1000), // 30 hours ago
        note: 'Archival leather treatment and hand-carved bone clasp fitted by master artisan.',
      },
      {
        status: 'shipped',
        timestamp: new Date(now.getTime() - 8 * 3600 * 1000), // 8 hours ago
        note: 'Dispatched via DHL Express Worldwide. Package has cleared regional sorting facility.',
      },
    ],
    createdAt: order2Date,
  });

  // Order 3: Delivered (Full completion lifecycle showcase)
  const order3Date = new Date(now.getTime() - 6 * 24 * 3600 * 1000); // 6 days ago
  const order3Products = [
    { productData: tray, quantity: 1 },
    { productData: bowl, quantity: 1 },
  ];
  const order3Total = tray.price + bowl.price;

  const order3 = new Order({
    user: {
      email: 'sara@example.com',
      userId: sara._id,
      name: 'Sara Hassan',
    },
    products: order3Products,
    subtotal: order3Total,
    shippingFee: 0,
    discount: { code: 'HERITAGE15', discountType: 'percentage', discountValue: 15, amount: Math.round(order3Total * 0.15) },
    totalPrice: Math.round((order3Total * 0.85) * 100) / 100,
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    paymentReference: 'PAYMOB-ORD-740192',
    shippingAddress: {
      name: 'Sara Hassan',
      street: '12 Al Fateh Avenue, Apt 4B',
      city: 'Manama',
      country: 'Bahrain',
      postalCode: '316',
    },
    carrier: 'FedEx Priority White-Glove',
    trackingNumber: 'FDX-441209-BH',
    estimatedDeliveryDate: new Date(now.getTime() - 24 * 3600 * 1000),
    timeline: [
      {
        status: 'confirmed',
        timestamp: order3Date,
        note: 'Order placed and payment authorized via Paymob Vault.',
      },
      {
        status: 'crafting',
        timestamp: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
        note: 'Hand-hammered brass relief and floral repousse completed in Najd atelier.',
      },
      {
        status: 'shipped',
        timestamp: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        note: 'Package handed over to FedEx Priority courier with climate-controlled handling.',
      },
      {
        status: 'delivered',
        timestamp: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
        note: 'Delivered directly into patron\'s hands at 12 Al Fateh Avenue, Manama.',
      },
    ],
    createdAt: order3Date,
  });

  const created = await Order.insertMany([order1, order2, order3]);
  console.log(`[Seed] Successfully seeded ${created.length} pristine showcase orders for sara@example.com:`);
  created.forEach((ord, idx) => {
    console.log(`  #${idx + 1}: ${ord._id} | Status: "${ord.status}" | Carrier: ${ord.carrier} (${ord.trackingNumber}) | Total: $${ord.totalPrice}`);
  });

  await mongoose.disconnect();
  console.log('Finished successfully.');
}

cleanAndSeedSaraOrders().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
