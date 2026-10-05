/**
 * @file services/adminService.js
 * @description Domain logic for platform administration: platform-wide Gross Merchandise Value (GMV),
 *              marketplace analytics, cross-seller order audit, and artisan directory metrics.
 */

const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

/**
 * Aggregates marketplace-wide metrics, recent orders, and ranked artisan sales.
 *
 * @returns {Promise<{ stats: object, recentOrders: Array, topArtisans: Array }>}
 */
async function getPlatformStats() {
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  const totalOrders = orders.length;

  let totalRevenue = 0;
  let pendingOrdersCount = 0;
  for (const order of orders) {
    if (order.status === 'pending') pendingOrdersCount++;
    if (order.paymentStatus === 'paid' || ['confirmed', 'shipped', 'delivered'].includes(order.status)) {
      totalRevenue += Number(order.totalPrice) || 0;
    }
  }

  const [totalProducts, totalArtisans, totalCustomers] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'customer' }),
  ]);

  const recentOrders = orders.slice(0, 6).map((o) => ({
    _id: o._id,
    createdAt: o.createdAt,
    status: o.status,
    paymentStatus: o.paymentStatus,
    customerName: o.user?.name || o.user?.email || 'Patron',
    customerEmail: o.user?.email || '',
    itemsCount: (o.products || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
    totalPrice: o.totalPrice,
  }));

  const sellers = await User.find({ role: 'seller' })
    .select('name email avatar sellerProfile createdAt')
    .lean();

  const topArtisans = await Promise.all(
    sellers.map(async (s) => {
      const sId = s._id.toString();
      const productCount = await Product.countDocuments({ userId: s._id });
      let sales = 0;
      for (const order of orders) {
        if (order.paymentStatus === 'paid' || ['confirmed', 'shipped', 'delivered'].includes(order.status)) {
          for (const item of order.products || []) {
            const itemUserId = (item.productData?.userId?._id || item.productData?.userId || '').toString();
            if (itemUserId === sId) {
              sales += (Number(item.productData?.price) || 0) * (Number(item.quantity) || 1);
            }
          }
        }
      }
      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        avatar: s.avatar,
        shopName: s.sellerProfile?.shopName || s.name,
        location: s.sellerProfile?.location || { city: '', country: '' },
        productCount,
        grossSales: Math.round(sales * 100) / 100,
        joinedAt: s.createdAt,
      };
    })
  );

  return {
    stats: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      pendingOrdersCount,
      totalProducts,
      totalArtisans,
      totalCustomers,
    },
    recentOrders,
    topArtisans: topArtisans.sort((a, b) => b.grossSales - a.grossSales),
  };
}

/**
 * Returns all platform orders sorted descending by creation time.
 *
 * @returns {Promise<Array>}
 */
async function getAllOrders() {
  return Order.find().sort({ createdAt: -1 }).lean();
}

/**
 * Returns the artisan directory with associated active piece counts.
 *
 * @returns {Promise<Array>}
 */
async function getArtisansDirectory() {
  const sellers = await User.find({ role: 'seller' })
    .select('name email avatar sellerProfile createdAt')
    .lean();

  return Promise.all(
    sellers.map(async (s) => {
      const productCount = await Product.countDocuments({ userId: s._id });
      return {
        ...s,
        productCount,
      };
    })
  );
}

module.exports = {
  getPlatformStats,
  getAllOrders,
  getArtisansDirectory,
};
