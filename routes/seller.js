const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const Order = require('../models/order');
const Product = require('../models/product');
const isSellerOrAdmin = require('../middleware/require-role')('seller', 'admin');

// All seller routes require 'seller' or 'admin' role
router.use(isSellerOrAdmin);

// ─── GET /api/seller/stats ────────────────────────────────────────────────────
// Aggregated statistics for the authenticated seller
router.get('/stats', async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const sellerIdStr = sellerId.toString();

    // 1. All products created by this seller
    const products = await Product.find({ userId: sellerId }).lean();
    const totalProducts = products.length;

    // Calculate rating metrics from active catalog
    const reviewedProducts = products.filter(p => p.ratings && p.ratings.count > 0);
    const averageRating = reviewedProducts.length > 0
      ? Math.round((reviewedProducts.reduce((sum, p) => sum + p.ratings.average, 0) / reviewedProducts.length) * 10) / 10
      : 0;
    const totalReviews = products.reduce((sum, p) => sum + (p.ratings?.count || 0), 0);

    // 2. Orders containing this seller's products
    const orders = await Order.find({
      $or: [
        { 'products.productData.userId': sellerId },
        { 'products.productData.userId': sellerIdStr },
      ],
    }).sort({ createdAt: -1 }).lean();

    const totalOrders = orders.length;
    let totalRevenue = 0;
    let pendingOrdersCount = 0;

    for (const order of orders) {
      if (order.status === 'pending') {
        pendingOrdersCount++;
      }
      // Calculate revenue from paid orders (or confirmed/delivered)
      if (order.paymentStatus === 'paid' || ['confirmed', 'shipped', 'delivered'].includes(order.status)) {
        for (const item of (order.products || [])) {
          const itemUserId = (item.productData?.userId?._id || item.productData?.userId || '').toString();
          if (itemUserId === sellerIdStr) {
            const price = Number(item.productData?.price) || 0;
            const qty = Number(item.quantity) || 1;
            totalRevenue += price * qty;
          }
        }
      }
    }

    // 3. Recent 5 orders overview
    const recentOrders = orders.slice(0, 5).map(order => {
      const sellerItems = (order.products || []).filter(item => {
        const itemUserId = (item.productData?.userId?._id || item.productData?.userId || '').toString();
        return itemUserId === sellerIdStr;
      });
      const sellerTotal = sellerItems.reduce((sum, item) => {
        const price = Number(item.productData?.price) || 0;
        const qty = Number(item.quantity) || 1;
        return sum + price * qty;
      }, 0);

      return {
        _id: order._id,
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerName: order.user?.name || order.user?.email || 'Client',
        customerEmail: order.user?.email || '',
        itemsCount: sellerItems.reduce((acc, i) => acc + (i.quantity || 1), 0),
        sellerTotal: Math.round(sellerTotal * 100) / 100,
      };
    });

    res.json({
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        pendingOrdersCount,
        totalProducts,
        averageRating,
        totalReviews,
      },
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seller/orders ───────────────────────────────────────────────────
// List orders containing seller's items with optional ?status= filter
router.get('/orders', async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const sellerIdStr = sellerId.toString();
    const { status } = req.query;

    const query = {
      $or: [
        { 'products.productData.userId': sellerId },
        { 'products.productData.userId': sellerIdStr },
      ],
    };

    if (status && ['pending', 'confirmed', 'crafting', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const rawOrders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const orders = rawOrders.map(order => {
      // Filter products down to only those owned by this seller
      const sellerProducts = (order.products || []).filter(item => {
        const itemUserId = (item.productData?.userId?._id || item.productData?.userId || '').toString();
        return itemUserId === sellerIdStr;
      });

      const sellerSubtotal = sellerProducts.reduce((sum, item) => {
        const price = Number(item.productData?.price) || 0;
        const qty = Number(item.quantity) || 1;
        return sum + price * qty;
      }, 0);

      return {
        _id: order._id,
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        carrier: order.carrier || 'Aramex White-Glove Express',
        trackingNumber: order.trackingNumber || '',
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        timeline: order.timeline || [],
        shippingAddress: order.shippingAddress || {},
        customer: {
          name: order.user?.name || '',
          email: order.user?.email || '',
        },
        products: sellerProducts,
        sellerSubtotal: Math.round(sellerSubtotal * 100) / 100,
        orderTotal: order.totalPrice,
      };
    });

    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/seller/orders/:orderId/status ─────────────────────────────────
// Update order fulfillment status, carrier, tracking number, and append timeline milestone
router.patch('/orders/:orderId/status', [
  body('status').isIn(['pending', 'confirmed', 'crafting', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid order status'),
  body('trackingNumber').optional().trim().isLength({ max: 100 }),
  body('carrier').optional().trim().isLength({ max: 100 }),
  body('note').optional().trim().isLength({ max: 500 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
    }

    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorize: seller must own at least one item in the order, or user is admin
    const sellerIdStr = req.user._id.toString();
    const ownsItem = (order.products || []).some(item => {
      const itemUserId = (item.productData?.userId?._id || item.productData?.userId || '').toString();
      return itemUserId === sellerIdStr;
    });

    if (!ownsItem && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this order' });
    }

    order.status = req.body.status;
    if (req.body.trackingNumber !== undefined) {
      order.trackingNumber = req.body.trackingNumber.trim();
    }
    if (req.body.carrier !== undefined && req.body.carrier.trim()) {
      order.carrier = req.body.carrier.trim();
    }
    if (req.body.estimatedDeliveryDate !== undefined) {
      order.estimatedDeliveryDate = req.body.estimatedDeliveryDate;
    }

    if (!Array.isArray(order.timeline)) {
      order.timeline = [];
    }

    const defaultNotes = {
      pending: 'Order received and awaiting processing.',
      confirmed: 'Order confirmed and payment secured.',
      crafting: 'Artisan has commenced handcrafting in the studio workshop.',
      shipped: `Parcel dispatched via ${order.carrier || 'courier'}${order.trackingNumber ? ` (${order.trackingNumber})` : ''}.`,
      delivered: 'Package successfully delivered to patron.',
      cancelled: 'Order has been cancelled.',
    };

    const note = req.body.note?.trim() || defaultNotes[order.status] || `Status updated to ${order.status}`;

    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      note,
    });

    await order.save();
    res.json({ message: 'Order status updated successfully', order });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seller/profile ──────────────────────────────────────────────────
// Retrieve seller profile
router.get('/profile', (req, res) => {
  const { name, email, avatar, role, sellerProfile } = req.user;
  res.json({
    seller: {
      name,
      email,
      avatar,
      role,
      sellerProfile: sellerProfile || {
        shopName: '',
        shopDescription: '',
        shopBanner: '',
        location: { city: '', country: '', lat: null, lng: null },
      },
    },
  });
});

// ─── PATCH /api/seller/profile ────────────────────────────────────────────────
// Update seller profile details
router.patch('/profile', [
  body('shopName').optional().trim().isLength({ max: 100 }).withMessage('Shop name too long'),
  body('shopDescription').optional().trim().isLength({ max: 1000 }).withMessage('Shop description too long'),
  body('shopBanner').optional().trim(),
  body('city').optional().trim().isLength({ max: 100 }),
  body('country').optional().trim().isLength({ max: 100 }),
  body('name').optional().trim().isLength({ max: 100 }),
  body('avatar').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errorMessage: errors.array()[0].msg });
    }

    const currentProfile = req.user.sellerProfile ? (req.user.sellerProfile.toObject?.() || req.user.sellerProfile) : {};
    const updatedProfile = {
      ...currentProfile,
      shopName: req.body.shopName !== undefined ? req.body.shopName : currentProfile.shopName,
      shopDescription: req.body.shopDescription !== undefined ? req.body.shopDescription : currentProfile.shopDescription,
      shopBanner: req.body.shopBanner !== undefined ? req.body.shopBanner : currentProfile.shopBanner,
      location: {
        ...(currentProfile.location || {}),
        ...(req.body.city !== undefined ? { city: req.body.city } : {}),
        ...(req.body.country !== undefined ? { country: req.body.country } : {}),
      },
    };

    req.user.sellerProfile = updatedProfile;
    if (req.body.name !== undefined) req.user.name = req.body.name;
    if (req.body.avatar !== undefined) req.user.avatar = req.body.avatar;

    await req.user.save();
    res.json({
      message: 'Seller profile updated successfully',
      seller: {
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        role: req.user.role,
        sellerProfile: req.user.sellerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
