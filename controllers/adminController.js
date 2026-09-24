const { validationResult } = require('express-validator');
const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const fileHelper = require('../util/file');

function publicProduct(p) {
  const isPopulated = p.userId && typeof p.userId === 'object' && p.userId._id;
  const artisan = isPopulated
    ? {
        _id: p.userId._id,
        name: p.userId.name,
        email: p.userId.email,
        shopName: p.userId.sellerProfile?.shopName || p.userId.name,
      }
    : null;

  return {
    _id: p._id,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    discount: p.discount || { type: 'percentage', value: 0, isActive: false },
    badge: p.badge,
    description: p.description,
    imageUrl: p.imageUrl,
    userId: isPopulated ? p.userId._id : p.userId,
    artisan,
    category: p.category,
    stock: p.stock !== undefined ? p.stock : 20,
    lowStockThreshold: p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5,
    isAvailable: p.isAvailable !== undefined ? p.isAvailable : true,
  };
}

// ─── Platform Admin Analytics & Overview ─────────────────────────────────────
exports.getAdminStats = async (req, res, next) => {
  try {
    // 1. Total platform revenue and orders
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

    // 2. Total catalog pieces
    const totalProducts = await Product.countDocuments();

    // 3. User counts
    const totalArtisans = await User.countDocuments({ role: 'seller' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 4. Recent 6 platform orders
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

    // 5. Top Artisans roster with sales and catalog count
    const sellers = await User.find({ role: 'seller' }).select('name email avatar sellerProfile createdAt').lean();
    const topArtisans = await Promise.all(
      sellers.map(async (s) => {
        const sId = s._id.toString();
        const productCount = await Product.countDocuments({ userId: s._id });
        let sales = 0;
        for (const order of orders) {
          if (order.paymentStatus === 'paid' || ['confirmed', 'shipped', 'delivered'].includes(order.status)) {
            for (const item of (order.products || [])) {
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

    res.json({
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
    });
  } catch (err) {
    next(err);
  }
};

// ─── Platform Admin All Orders ───────────────────────────────────────────────
exports.getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// ─── Platform Admin Artisans Directory ───────────────────────────────────────
exports.getAdminArtisans = async (req, res, next) => {
  try {
    const sellers = await User.find({ role: 'seller' }).select('name email avatar sellerProfile createdAt').lean();
    const artisans = await Promise.all(
      sellers.map(async (s) => {
        const productCount = await Product.countDocuments({ userId: s._id });
        return {
          ...s,
          productCount,
        };
      })
    );
    res.json({ artisans });
  } catch (err) {
    next(err);
  }
};

// ─── Product Management (Admin & Seller) ─────────────────────────────────────
exports.postAddProduct = (req, res, next) => {
  const { title, price, description, stock, lowStockThreshold } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(422).json({ errorMessage: 'Attached file is not a valid image (png/jpg/jpeg).', validationErrors: [] });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  const productData = {
    title,
    price,
    description,
    imageUrl: image.path,
    userId: req.user._id,
  };
  if (stock !== undefined && stock !== '') productData.stock = Number(stock);
  if (lowStockThreshold !== undefined && lowStockThreshold !== '') {
    productData.lowStockThreshold = Number(lowStockThreshold);
  }

  new Product(productData)
    .save()
    .then((p) => res.status(201).json({ product: publicProduct(p) }))
    .catch((err) => next(new Error(err)));
};

exports.getAdminProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .populate('userId', 'name email sellerProfile')
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const isOwner = product.userId._id.toString() === req.user._id.toString() ||
                      product.userId.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      res.json({ product: publicProduct(product) });
    })
    .catch((err) => next(new Error(err)));
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  const { title, price, description, stock, lowStockThreshold, isAvailable } = req.body;
  const image = req.file;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const isOwner = product.userId.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      product.title = title;
      product.price = price;
      product.description = description;
      if (stock !== undefined && stock !== '') product.stock = Number(stock);
      if (lowStockThreshold !== undefined && lowStockThreshold !== '') {
        product.lowStockThreshold = Number(lowStockThreshold);
      }
      if (isAvailable !== undefined) {
        product.isAvailable = isAvailable === 'true' || isAvailable === true;
      }
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then((p) => res.json({ product: publicProduct(p) }));
    })
    .catch((err) => next(new Error(err)));
};

exports.getProducts = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = {};
    if (!isAdmin) {
      filter.userId = req.user._id;
    } else if (req.query.sellerId) {
      filter.userId = req.query.sellerId;
    }

    const products = await Product.find(filter)
      .populate('userId', 'name email sellerProfile')
      .sort({ createdAt: -1 });

    res.json({ products: products.map(publicProduct) });
  } catch (err) {
    next(new Error(err));
  }
};

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const isOwner = product.userId.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: productId })
        .then(() => res.status(200).json({ message: 'Product deleted' }));
    })
    .catch(() => res.status(500).json({ message: 'Delete failed' }));
};

exports.postProductDiscount = (req, res, next) => {
  const productId = req.params.productId;
  const { type, value } = req.body;

  if (!type || !['percentage', 'fixed'].includes(type)) {
    return res.status(422).json({ message: 'Invalid discount type. Must be percentage or fixed.' });
  }
  const numericValue = Number(value);
  if (isNaN(numericValue) || numericValue <= 0) {
    return res.status(422).json({ message: 'Discount value must be greater than zero.' });
  }

  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const isOwner = product.userId.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Preserve original baseline price
      const originalPrice = product.compareAtPrice != null ? product.compareAtPrice : product.price;

      let discountedPrice;
      if (type === 'percentage') {
        if (numericValue >= 100) {
          return res.status(422).json({ message: 'Percentage discount must be less than 100%.' });
        }
        discountedPrice = Math.round(originalPrice * (1 - numericValue / 100) * 100) / 100;
      } else {
        if (numericValue >= originalPrice) {
          return res.status(422).json({ message: 'Fixed discount must be less than the product price.' });
        }
        discountedPrice = Math.round((originalPrice - numericValue) * 100) / 100;
      }

      product.compareAtPrice = originalPrice;
      product.price = discountedPrice;
      product.badge = 'sale';
      product.discount = {
        type,
        value: numericValue,
        isActive: true,
      };

      return product.save().then((saved) =>
        res.json({ message: 'Discount applied successfully', product: publicProduct(saved) })
      );
    })
    .catch((err) => next(new Error(err)));
};

exports.deleteProductDiscount = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const isOwner = product.userId.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      if (product.compareAtPrice != null) {
        product.price = product.compareAtPrice;
        product.compareAtPrice = null;
      }
      if (product.badge === 'sale') {
        product.badge = '';
      }
      product.discount = {
        type: 'percentage',
        value: 0,
        isActive: false,
      };

      return product.save().then((saved) =>
        res.json({ message: 'Discount removed successfully', product: publicProduct(saved) })
      );
    })
    .catch((err) => next(new Error(err)));
};
