require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');
const User = require('./models/user');
const Review = require('./models/review');

const PRODUCT_IMAGE_MAP = {
  'Artisanal Ceramic Vessel': 'images/products/artisanal-ceramic-vessel.jpg',
  'Brushed Champagne Tea Set': 'images/products/brushed-champagne-tea-set.jpg',
  'Wabi-Sabi Bowl — Rust & Ash': 'images/products/wabi-sabi-bowl.jpg',
  'Monolithic Marble Bookends': 'images/products/monolithic-marble-bookends.jpg',
  'Architectural Leather Journal': 'images/products/architectural-leather-journal.jpg',
  'Bespoke Clothbound Monograph': 'images/products/bespoke-clothbound-monograph.jpg',
  'Atelier Archival Edition Vol. I': 'images/products/atelier-archival-edition.jpg',
  'Calligraphers Writing Case': 'images/products/calligraphers-writing-case.jpg',
  'Obsidian Brew Carafe': 'images/products/obsidian-brew-carafe.jpg',
  'Minimalist Amber Glass Flagon': 'images/products/minimalist-amber-glass-flagon.jpg',
  'Damascus Window Lantern': 'images/products/damascus-window-lantern.jpg',
  'Pressed Wildflower Votive Set': 'images/products/pressed-wildflower-votive-set.jpg',
  'Najdi Repousse Tray': 'images/products/najdi-repousse-tray.jpg',
  'Brass Incense Burner — Star Form': 'images/products/brass-incense-burner.jpg',
  'Dallah Coffee Pot — Heirloom Edition': 'images/products/dallah-coffee-pot.jpg',
  'Copper Hammam Bowl': 'images/products/copper-hammam-bowl.jpg',
  'Marbled Florentine Notebook': 'images/products/marbled-florentine-notebook.jpg',
  'Ikat Silk Table Runner': 'images/products/ikat-silk-table-runner.jpg',
  'Organic Linen Cushion — Desert Sand': 'images/products/organic-linen-cushion.jpg',
};

const TEST_PRODUCT_TITLES = [
  'Short Story',
  'Novel',
  'Coffee',
  'Juice',
  'Test Product',
];

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Identify test products to delete
  const testProducts = await Product.find({
    $or: [
      { title: { $in: TEST_PRODUCT_TITLES } },
      { title: { $regex: /test/i } },
    ]
  });

  const testIds = testProducts.map(p => p._id);
  console.log(`Found ${testProducts.length} test products to delete:`, testProducts.map(p => p.title));

  if (testIds.length > 0) {
    // Clean up cart references
    const userUpdateRes = await User.updateMany(
      {},
      { $pull: { 'cart.items': { productId: { $in: testIds } } } }
    );
    console.log(`Cleaned up user carts: ${userUpdateRes.modifiedCount} users updated.`);

    // Clean up review references
    const reviewDeleteRes = await Review.deleteMany({ productId: { $in: testIds } });
    console.log(`Deleted reviews for test products: ${reviewDeleteRes.deletedCount}`);

    // Delete products
    const prodDeleteRes = await Product.deleteMany({ _id: { $in: testIds } });
    console.log(`Deleted test products: ${prodDeleteRes.deletedCount}`);
  }

  // 2. Update legitimate products with new luxury photos
  let updatedCount = 0;
  for (const [title, imageUrl] of Object.entries(PRODUCT_IMAGE_MAP)) {
    const res = await Product.updateOne({ title }, { $set: { imageUrl } });
    if (res.matchedCount > 0) {
      updatedCount++;
      console.log(`[Updated] ${title} -> ${imageUrl}`);
    } else {
      console.log(`[Notice] Product not found in DB: ${title}`);
    }
  }
  console.log(`\nSuccessfully updated ${updatedCount} products with new imagery.`);

  // 3. Verify total remaining products
  const remaining = await Product.find({}, 'title price category imageUrl').lean();
  console.log(`\nRemaining catalog count: ${remaining.length} products:`);
  remaining.forEach(p => console.log(` - ${p.title} (${p.category}): ${p.imageUrl}`));

  await mongoose.disconnect();
  console.log('\nMigration complete.');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
