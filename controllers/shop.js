const Product = require('../models/product');
const Order = require('../models/order');
const Discount = require('../models/discount');
const path = require('path');
const { generateInvoicePdf } = require('../util/invoiceGenerator');
const { validationResult } = require('express-validator');

const ITEMS_PER_PAGE = 6;

const SORTS = {
  price_asc:  { price: 1, _id: -1 },
  price_desc: { price: -1, _id: -1 },
  title_asc:  { title: 1, _id: -1 },
  newest:     { createdAt: -1, _id: -1 },
  rating:     { 'ratings.average': -1, 'ratings.count': -1, _id: -1 },
};

function buildProductQuery(req) {
  const q        = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();
  const badge    = (req.query.badge || '').trim();
  const sellerId = (req.query.sellerId || '').trim();
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
  const minRating = req.query.minRating !== undefined ? Number(req.query.minRating) : undefined;

  const filter = {};

  if (q) {
    filter.$or = [
      { title:       { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags:        { $elemMatch: { $regex: q, $options: 'i' } } },
    ];
  }

  // Exact enum match for category
  if (category) filter.category = category;

  // Badge filter
  if (badge) filter.badge = badge;

  // Seller filter
  if (sellerId) filter.userId = sellerId;

  // Price range
  if (!Number.isNaN(minPrice) && minPrice !== undefined) {
    filter.price = { ...(filter.price || {}), $gte: minPrice };
  }
  if (!Number.isNaN(maxPrice) && maxPrice !== undefined) {
    filter.price = { ...(filter.price || {}), $lte: maxPrice };
  }

  // Minimum rating filter
  if (!Number.isNaN(minRating) && minRating !== undefined) {
    filter['ratings.average'] = { $gte: minRating };
  }

  return filter;
}

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  const itemsPerPage = req.query.limit ? Math.min(50, Math.max(1, +req.query.limit)) : ITEMS_PER_PAGE;
  const filter = buildProductQuery(req);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  let totalItems;
  Product.find(filter)
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Product.find(filter)
        .sort(sort)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then((products) => {
      res.json({
        products,
        pagination: {
          currentPage: page,
          totalItems,
          lastPage: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          hasNextPage: itemsPerPage * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
        },
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .populate('userId', 'name avatar sellerProfile email')
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json({ product });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

function serializeCart(user) {
  const items = user.cart.items
    .filter((i) => i.productId)
    .map((i) => {
      const prod = i.productId;
      const variantIdStr = i.variantId ? i.variantId.toString() : null;
      let variant = null;
      let unitPrice = prod.price;
      let availableStock = prod.stock !== undefined ? prod.stock : 20;

      if (variantIdStr && Array.isArray(prod.variants)) {
        const found = prod.variants.find((v) => v._id.toString() === variantIdStr);
        if (found) {
          variant = {
            _id: found._id,
            name: found.name,
            sku: found.sku,
            price: found.price,
            compareAtPrice: found.compareAtPrice,
            stock: found.stock,
          };
          if (typeof found.price === 'number') {
            unitPrice = found.price;
          }
          if (typeof found.stock === 'number') {
            availableStock = found.stock;
          }
        }
      }

      return {
        _id: i._id,
        product: prod,
        quantity: i.quantity,
        variantId: variantIdStr,
        variant,
        unitPrice,
        stock: availableStock,
      };
    });
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.quantity * (i.unitPrice !== undefined ? i.unitPrice : i.product.price), 0);
  return { items, totalItems, totalPrice: Math.round(totalPrice * 100) / 100 };
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCart = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  try {
    const { productId, variantId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const addQty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    let selectedVariant = null;
    let availableStock = product.stock !== undefined ? product.stock : 20;

    const variantIdStr = variantId ? String(variantId) : null;
    if (variantIdStr && Array.isArray(product.variants)) {
      selectedVariant = product.variants.find((v) => v._id.toString() === variantIdStr);
      if (!selectedVariant) {
        return res.status(400).json({ message: 'Selected variant not found' });
      }
      if (typeof selectedVariant.stock === 'number') {
        availableStock = selectedVariant.stock;
      }
    }

    if (availableStock <= 0 || product.isAvailable === false) {
      return res.status(400).json({ message: 'This handcrafted item is currently sold out' });
    }

    const existing = req.user.cart.items.find((i) => {
      const matchProd = i.productId.toString() === product._id.toString();
      const matchVar = (i.variantId ? i.variantId.toString() : null) === variantIdStr;
      return matchProd && matchVar;
    });

    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + addQty > availableStock) {
      return res.status(400).json({ message: `Only ${availableStock} pieces available in studio` });
    }

    await req.user.addToCart(product, variantIdStr, addQty);
    const user = await req.user.populate('cart.items.productId');
    res.json(serializeCart(user));
  } catch (err) {
    next(new Error(err));
  }
};

exports.postCartDeleteProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  const { productId, variantId } = req.body;
  req.user
    .removeFromCart(productId, variantId || null)
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCartDecrement = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  const id = String(req.body.productId);
  const variantIdStr = req.body.variantId ? String(req.body.variantId) : null;

  const line = req.user.cart.items.find((i) => {
    const matchProd = String(i.productId) === id;
    const matchVar = (i.variantId ? String(i.variantId) : null) === variantIdStr;
    return matchProd && matchVar;
  });

  if (!line) {
    return req.user
      .populate('cart.items.productId')
      .then((user) => res.json(serializeCart(user)));
  }

  if (line.quantity <= 1) {
    req.user.cart.items = req.user.cart.items.filter((i) => {
      const matchProd = String(i.productId) === id;
      const matchVar = (i.variantId ? String(i.variantId) : null) === variantIdStr;
      return !(matchProd && matchVar);
    });
  } else {
    line.quantity -= 1;
  }

  req.user
    .save()
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');
    const lines = user.cart.items.filter((i) => i.productId);
    if (lines.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Stock verification across all line items
    for (const item of lines) {
      const prod = item.productId;
      const variantIdStr = item.variantId ? item.variantId.toString() : null;
      let variant = null;
      let availableStock = prod.stock !== undefined ? prod.stock : 20;

      if (variantIdStr && Array.isArray(prod.variants)) {
        variant = prod.variants.find((v) => v._id.toString() === variantIdStr);
        if (variant && typeof variant.stock === 'number') {
          availableStock = variant.stock;
        }
      }

      if (prod.isAvailable === false || availableStock <= 0) {
        const itemTitle = variant ? `${prod.title} (${variant.name})` : prod.title;
        return res.status(400).json({
          message: `"${itemTitle}" is sold out. Please remove it from your cart to proceed.`,
        });
      }
      if (availableStock < item.quantity) {
        const itemTitle = variant ? `${prod.title} (${variant.name})` : prod.title;
        return res.status(400).json({
          message: `Only ${availableStock} pieces of "${itemTitle}" available in studio. Please adjust your quantity.`,
        });
      }
    }

    const products = lines.map((i) => {
      const prod = i.productId;
      const variantIdStr = i.variantId ? i.variantId.toString() : null;
      let variant = null;
      let price = prod.price;

      if (variantIdStr && Array.isArray(prod.variants)) {
        const found = prod.variants.find((v) => v._id.toString() === variantIdStr);
        if (found) {
          variant = {
            _id: found._id,
            name: found.name,
            sku: found.sku,
            price: found.price,
            compareAtPrice: found.compareAtPrice,
            stock: found.stock,
          };
          if (typeof found.price === 'number') {
            price = found.price;
          }
        }
      }

      return {
        quantity: i.quantity,
        productData: { ...prod._doc, price },
        variant,
      };
    });
    const subtotal = products.reduce((s, p) => s + p.quantity * (p.variant?.price ?? p.productData.price), 0);

    let discountInfo = {
      code: '',
      discountType: '',
      discountValue: 0,
      amount: 0,
    };

    const discountCode = req.body?.discountCode;
    let discountDoc = null;
    if (discountCode && typeof discountCode === 'string') {
      const cleanCode = discountCode.trim().toUpperCase();
      discountDoc = await Discount.findOne({ code: cleanCode, isActive: true });
      if (discountDoc) {
        const now = new Date();
        const validDates = (!discountDoc.startDate || now >= discountDoc.startDate) &&
                           (!discountDoc.endDate || now <= discountDoc.endDate);
        const validUsage = discountDoc.usageLimit === null || discountDoc.usedCount < discountDoc.usageLimit;
        const validMin = subtotal >= discountDoc.minOrderAmount;

        if (validDates && validUsage && validMin) {
          let discountAmt = 0;
          if (discountDoc.discountType === 'percentage') {
            discountAmt = Math.round((subtotal * (discountDoc.discountValue / 100)) * 100) / 100;
            if (discountDoc.maxDiscount && discountAmt > discountDoc.maxDiscount) {
              discountAmt = discountDoc.maxDiscount;
            }
          } else {
            discountAmt = Math.min(subtotal, discountDoc.discountValue);
          }

          discountInfo = {
            code: discountDoc.code,
            discountType: discountDoc.discountType,
            discountValue: discountDoc.discountValue,
            amount: discountAmt,
          };
        }
      }
    }

    const shippingFee = typeof req.body?.shippingFee === 'number' ? Math.max(0, req.body.shippingFee) : 0;
    const totalPrice = Math.max(0, Math.round((subtotal - discountInfo.amount + shippingFee) * 100) / 100);

    const shippingAddress = req.body?.shippingAddress || {};
    const billingAddress = req.body?.billingAddress || shippingAddress;
    const paymentMethod = req.body?.paymentMethod || 'card';
    const isCod = paymentMethod === 'cash_on_delivery';
    const paymentStatus = isCod ? 'unpaid' : 'paid';
    const paymentReference = req.body?.paymentReference || (isCod ? `MOCK-COD-${Date.now()}` : `MOCK-PAY-${Date.now()}`);

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const initialTimeline = [
      {
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Order confirmed and payment secured via encrypted vault.',
      },
    ];

    const carrier = req.body?.carrier || 'Aramex White-Glove Express';
    const trackingNumber = req.body?.trackingNumber || `ARX-${Math.floor(100000 + Math.random() * 900000)}-AE`;

    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user._id,
        name: shippingAddress.name || req.user.name || '',
      },
      products,
      subtotal,
      shippingFee,
      discount: discountInfo,
      totalPrice,
      shippingAddress: {
        name: shippingAddress.name || '',
        street: shippingAddress.street || '',
        city: shippingAddress.city || '',
        country: shippingAddress.country || '',
        postalCode: shippingAddress.postalCode || '',
      },
      paymentMethod,
      paymentStatus,
      paymentReference,
      status: 'confirmed',
      carrier,
      trackingNumber,
      estimatedDeliveryDate: estimatedDelivery,
      timeline: initialTimeline,
      notes: req.body?.billingAddress ? `Billing: ${billingAddress.street || ''}, ${billingAddress.city || ''}` : '',
    });

    const saved = await order.save();

    // Decrement stock for purchased items
    for (const item of lines) {
      const variantIdStr = item.variantId ? item.variantId.toString() : null;
      if (variantIdStr) {
        await Product.updateOne(
          { _id: item.productId._id, 'variants._id': item.variantId },
          {
            $inc: {
              'variants.$.stock': -item.quantity,
              stock: -item.quantity,
            },
          }
        );
      } else {
        await Product.findByIdAndUpdate(item.productId._id, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    if (discountDoc && discountInfo.amount > 0) {
      discountDoc.usedCount += 1;
      await discountDoc.save();
    }

    await req.user.clearCart();

    const saveToProfile = req.body?.saveToProfile || {};
    let shouldSaveUser = false;

    if (saveToProfile.saveContactInfo) {
      if (shippingAddress.name && typeof shippingAddress.name === 'string' && shippingAddress.name.trim()) {
        req.user.name = shippingAddress.name.trim();
        shouldSaveUser = true;
      }
      if (shippingAddress.phone && typeof shippingAddress.phone === 'string' && shippingAddress.phone.trim()) {
        req.user.phone = shippingAddress.phone.trim();
        shouldSaveUser = true;
      }
    }

    if (saveToProfile.saveDefaultAddress && shippingAddress.street && shippingAddress.city && shippingAddress.country) {
      const street = shippingAddress.street.trim();
      const city = shippingAddress.city.trim();
      const country = shippingAddress.country.trim();
      const postalCode = shippingAddress.postalCode ? shippingAddress.postalCode.trim() : '';
      const phone = shippingAddress.phone ? shippingAddress.phone.trim() : (req.user.phone || '');
      const name = shippingAddress.name ? shippingAddress.name.trim() : (req.user.name || '');

      if (!Array.isArray(req.user.addresses)) {
        req.user.addresses = [];
      }

      req.user.addresses.forEach((a) => {
        a.isDefault = false;
      });

      const existing = req.user.addresses.find((a) =>
        a.street?.trim().toLowerCase() === street.toLowerCase() &&
        a.city?.trim().toLowerCase() === city.toLowerCase() &&
        a.country?.trim().toLowerCase() === country.toLowerCase()
      );

      if (existing) {
        existing.isDefault = true;
        if (name) existing.name = name;
        if (phone) existing.phone = phone;
        if (postalCode) existing.postalCode = postalCode;
      } else {
        req.user.addresses.push({
          label: 'Default',
          name,
          street,
          city,
          country,
          postalCode,
          phone,
          isDefault: true,
        });
      }

      req.user.address = { street, city, country, postalCode };
      shouldSaveUser = true;
    }

    if (saveToProfile.saveDefaultPayment) {
      if (['card', 'apple_pay', 'cash_on_delivery'].includes(paymentMethod)) {
        req.user.defaultPaymentMethod = paymentMethod;
        shouldSaveUser = true;
      }
      if (paymentMethod === 'card') {
        const pd = req.body?.paymentDetails || {};
        const rawCard = pd.cardNumber ? String(pd.cardNumber).replace(/\D/g, '') : '';
        const last4 = rawCard ? rawCard.slice(-4) : (req.user.savedCard?.last4 || '4242');
        let brand = 'Visa';
        if (/^3[47]/.test(rawCard)) brand = 'Amex';
        else if (/^5[1-5]/.test(rawCard)) brand = 'Mastercard';

        req.user.savedCard = {
          cardholderName: pd.cardholderName || shippingAddress.name || req.user.name || '',
          last4,
          brand,
          expiry: pd.expiry || req.user.savedCard?.expiry || '',
        };
        shouldSaveUser = true;
      }
    }

    if (shouldSaveUser) {
      await req.user.save();
    }

    return res.status(201).json({
      order: {
        _id: saved._id,
        subtotal: saved.subtotal,
        shippingFee: saved.shippingFee,
        discount: saved.discount,
        totalPrice: saved.totalPrice,
        products: saved.products,
        shippingAddress: saved.shippingAddress,
        paymentMethod: saved.paymentMethod,
        paymentStatus: saved.paymentStatus,
        paymentReference: saved.paymentReference,
        status: saved.status,
        carrier: saved.carrier,
        trackingNumber: saved.trackingNumber,
        estimatedDeliveryDate: saved.estimatedDeliveryDate,
        timeline: saved.timeline,
      },
    });
  } catch (err) {
    next(new Error(err));
  }
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .sort({ _id: -1 })
    .then((orders) => res.json({ orders }))
    .catch((err) => next(new Error(err)));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      const isOwner = order.user.userId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

      generateInvoicePdf(order, res);

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {

      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      //   res.send(data);
      // });

    })
    .catch(err => {
      next(err)
    });

};