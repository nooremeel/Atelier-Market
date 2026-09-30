const express = require('express');
const router = express.Router();
const paymobService = require('../services/paymobService');
const Order = require('../models/order');
const Product = require('../models/product');
const Discount = require('../models/discount');
const User = require('../models/user');
const isCustomerOrAdmin = require('../middleware/require-role')('customer', 'admin');

/**
 * POST /api/paymob/initiate
 * Authenticated endpoint: customer initiates a checkout with Paymob.
 * Validates stock, calculates pricing, creates a 'pending' order in MongoDB,
 * and requests a Payment Key / iFrame URL from Paymob.
 */
router.post('/initiate', isCustomerOrAdmin, async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');
    const lines = user.cart.items.filter((i) => i.productId);

    if (lines.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // 1. Stock verification across all line items
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
          message: `Only ${availableStock} pieces of "${itemTitle}" available. Please adjust your quantity.`,
        });
      }
    }

    // 2. Prepare items and compute pricing
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

    // 3. Discount calculation
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
    const carrier = req.body?.carrier || 'White-Glove Express';
    const trackingNumber = `PAYMOB-${Math.floor(100000 + Math.random() * 900000)}-US`;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    // 4. Create Order with 'pending' status and 'unpaid' paymentStatus
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
      paymentMethod: 'card',
      paymentStatus: 'unpaid',
      paymentReference: '',
      status: 'pending',
      carrier,
      trackingNumber,
      estimatedDeliveryDate: estimatedDelivery,
      timeline: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Order initiated. Awaiting payment authorization via Paymob Gateway.',
        },
      ],
      notes: billingAddress ? `Billing: ${billingAddress.street || ''}, ${billingAddress.city || ''}` : '',
    });

    const savedOrder = await order.save();

    // 5. Contact Paymob via our 3-step service pipeline
    const paymentSession = await paymobService.createCardPaymentSession({
      orderId: savedOrder._id.toString(),
      totalPrice,
      currency: process.env.PAYMOB_CURRENCY || 'USD',
      billingData: {
        name: shippingAddress.name || req.user.name || 'Patron',
        email: req.user.email,
        phone: shippingAddress.phone || req.user.phone || '+12025550123',
        street: shippingAddress.street || 'NA',
        city: shippingAddress.city || 'New York',
        country: shippingAddress.country || 'US',
        postalCode: shippingAddress.postalCode || '10001',
      },
      items: products,
    });

    // Save Paymob order ID to order reference for reconciliation
    savedOrder.paymentReference = `PAYMOB-ORD-${paymentSession.paymobOrderId}`;
    await savedOrder.save();

    // NOTE: Cart is NOT cleared here; it will be cleared when payment is authorized.
    // This ensures that if the customer closes the modal, their cart items are preserved.

    return res.status(200).json({
      success: true,
      orderId: savedOrder._id,
      totalPrice: savedOrder.totalPrice,
      currency: paymentSession.currency,
      iframeUrl: paymentSession.iframeUrl,
      paymentToken: paymentSession.paymentToken,
      isSimulation: paymentSession.isSimulation,
    });
  } catch (err) {
    console.error('[Paymob Initiate Error]:', err);
    next(err);
  }
});

/**
 * POST /api/paymob/pay
 * Authenticated endpoint: Direct card payment processing via Paymob financial rail.
 * Provides immediate feedback and returns 3DS redirection URL or confirms payment.
 */
router.post('/pay', isCustomerOrAdmin, async (req, res, next) => {
  try {
    const { orderId, paymentToken, card } = req.body;

    if (!orderId || !paymentToken || !card) {
      return res.status(400).json({ message: 'Missing required card payment parameters.' });
    }

    const order = await Order.findOne({
      _id: orderId,
      'user.userId': req.user._id,
      status: 'pending',
    });

    if (!order) {
      return res.status(404).json({ message: 'Active pending order not found.' });
    }

    const billingData = {
      name: card.holderName || order.shippingAddress?.name || req.user.name,
      email: req.user.email,
      phone: req.user.phone || '+201000000000',
      street: order.shippingAddress?.street || 'NA',
      city: order.shippingAddress?.city || 'Cairo',
      country: order.shippingAddress?.country || 'EG',
      postalCode: order.shippingAddress?.postalCode || 'NA',
    };

    const result = await paymobService.processDirectCardPayment({
      paymentToken,
      cardData: card,
      billingData,
    });

    if (result.requires3ds && result.redirectionUrl) {
      return res.json({
        success: true,
        requires3ds: true,
        redirectionUrl: result.redirectionUrl,
      });
    }

    if (result.success) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.paymentReference = `PAYMOB-TXN-${result.transactionId || Date.now()}`;
      order.timeline.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: `Payment authorized via Paymob (Txn #${result.transactionId || 'DIRECT'}).`,
      });

      // Decrement stock
      for (const item of order.products) {
        const prodId = item.productData?._id;
        const variantId = item.variant?._id;
        if (prodId && variantId) {
          await Product.updateOne(
            { _id: prodId, 'variants._id': variantId },
            { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } }
          );
        } else if (prodId) {
          await Product.findByIdAndUpdate(prodId, { $inc: { stock: -item.quantity } });
        }
      }

      if (order.discount?.code) {
        await Discount.updateOne({ code: order.discount.code }, { $inc: { usedCount: 1 } });
      }

      await order.save();

      const customer = await User.findById(order.user.userId);
      if (customer) await customer.clearCart();

      return res.json({
        success: true,
        requires3ds: false,
        orderId: order._id,
      });
    }

    return res.status(400).json({
      success: false,
      message: result.message || 'Payment could not be authorized.',
    });
  } catch (err) {
    console.error('[Paymob Direct Pay Error]:', err.message);
    return res.status(400).json({
      success: false,
      message: err.message || 'Unable to process card payment with Paymob.',
    });
  }
});

/**
 * POST /api/paymob/webhook
 * Unauthenticated / Server-to-Server endpoint:
 * Paymob posts transaction result here.
 * Secured by HMAC-SHA512 verification (no CSRF cookie).
 */
router.post('/webhook', async (req, res) => {
  try {
    const receivedHmac = req.query.hmac || req.headers['x-paymob-hmac'] || req.body?.hmac;
    const transactionObj = req.body?.obj;

    console.log('[Paymob Webhook] Received callback for transaction:', transactionObj?.id);

    // 1. Verify cryptographic HMAC signature
    const isValidSignature = paymobService.verifyHmacSignature(transactionObj, receivedHmac);
    if (!isValidSignature) {
      console.error('[Paymob Webhook] Invalid HMAC signature detected! Rejecting request.');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const isSuccess = transactionObj?.success === true;
    const merchantOrderId = transactionObj?.order?.merchant_order_id;
    const transactionId = transactionObj?.id;

    if (!merchantOrderId) {
      console.warn('[Paymob Webhook] Missing merchant_order_id in payload.');
      return res.status(400).json({ message: 'Missing order reference' });
    }

    const order = await Order.findById(merchantOrderId);
    if (!order) {
      console.warn(`[Paymob Webhook] Order not found for ID: ${merchantOrderId}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Idempotency: if order is already marked as paid, return 200 immediately
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ message: 'Order already fulfilled' });
    }

    if (isSuccess) {
      console.log(`[Paymob Webhook] Payment confirmed for Order ${order._id}. Fulfilling...`);
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.paymentReference = `PAYMOB-TXN-${transactionId}`;
      order.timeline.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: `Payment authorized and secured via Paymob 3D-Secure (Txn #${transactionId}).`,
      });

      // Decrement inventory stock
      for (const item of order.products) {
        const prodId = item.productData?._id;
        const variantId = item.variant?._id;

        if (prodId && variantId) {
          await Product.updateOne(
            { _id: prodId, 'variants._id': variantId },
            {
              $inc: {
                'variants.$.stock': -item.quantity,
                stock: -item.quantity,
              },
            }
          );
        } else if (prodId) {
          await Product.findByIdAndUpdate(prodId, {
            $inc: { stock: -item.quantity },
          });
        }
      }

      // If discount was used, increment used count
      if (order.discount?.code) {
        await Discount.updateOne({ code: order.discount.code }, { $inc: { usedCount: 1 } });
      }

      await order.save();

      // Clear the customer's cart now that payment is confirmed
      const customer = await User.findById(order.user.userId);
      if (customer) {
        await customer.clearCart();
      }

      console.log(`[Paymob Webhook] Order ${order._id} successfully marked as PAID & stock decremented.`);
    } else {
      console.log(`[Paymob Webhook] Payment failed for Order ${order._id}. Marking cancelled.`);
      order.paymentStatus = 'unpaid';
      order.status = 'cancelled';
      order.timeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Payment rejected by gateway: ${transactionObj?.data?.message || 'Transaction declined'}.`,
      });
      await order.save();
    }

    // Paymob requires a 200 OK response
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Paymob Webhook Processing Error]:', err);
    return res.status(500).json({ message: 'Internal processing error' });
  }
});

/**
 * POST /api/paymob/simulate-success
 * Sandbox helper for local testing: simulates receiving a successful webhook.
 * Available only when in sandbox simulation mode.
 */
router.post('/simulate-success', isCustomerOrAdmin, async (req, res) => {
  if (!paymobService.isSimulationMode()) {
    return res.status(403).json({ message: 'Simulation endpoint disabled in live mode' });
  }

  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.paymentStatus === 'paid') {
    return res.json({ success: true, order });
  }

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.paymentReference = `SIM-TXN-${Date.now()}`;
  order.timeline.push({
    status: 'confirmed',
    timestamp: new Date(),
    note: 'Payment authorized and secured via Paymob Sandbox 3D-Secure simulation.',
  });

  // Decrement inventory stock
  for (const item of order.products) {
    const prodId = item.productData?._id;
    const variantId = item.variant?._id;

    if (prodId && variantId) {
      await Product.updateOne(
        { _id: prodId, 'variants._id': variantId },
        {
          $inc: {
            'variants.$.stock': -item.quantity,
            stock: -item.quantity,
          },
        }
      );
    } else if (prodId) {
      await Product.findByIdAndUpdate(prodId, {
        $inc: { stock: -item.quantity },
      });
    }
  }

  await order.save();

  // Clear customer cart upon authorized payment
  const customer = await User.findById(order.user.userId);
  if (customer) {
    await customer.clearCart();
  }

  return res.json({ success: true, order });
});

/**
 * POST /api/paymob/cancel
 * Customer closed or dismissed the Paymob payment modal without paying.
 * Removes the unconfirmed pending order draft so it never shows up in their order history.
 */
router.post('/cancel', isCustomerOrAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Missing orderId' });
    }

    const order = await Order.findOne({
      _id: orderId,
      'user.userId': req.user._id,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    if (order) {
      await Order.findByIdAndDelete(order._id);
      console.log(`[Paymob Cancel] Removed unconfirmed draft order ${order._id}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Paymob Cancel Error]:', err);
    next(err);
  }
});

/**
 * ALL /api/paymob/callback
 * Paymob Transaction Response Callback (Browser Redirection after 3DS).
 * When 3DS authentication completes, Paymob redirects the customer's browser here.
 */
router.all('/callback', async (req, res) => {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    const isSuccess = data.success === 'true' || data.success === true;
    const merchantOrderId = data.merchant_order_id;
    const txnId = data.id;

    console.log(`[Paymob Response Callback] Browser redirect received: Order=${merchantOrderId}, Success=${isSuccess}, Txn=${txnId}`);

    if (merchantOrderId) {
      const order = await Order.findById(merchantOrderId);
      if (order && isSuccess && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paymentReference = `PAYMOB-TXN-${txnId}`;
        order.timeline.push({
          status: 'confirmed',
          timestamp: new Date(),
          note: `Payment authorized via Paymob 3D-Secure redirection (Txn #${txnId}).`,
        });

        // Decrement stock if not already processed by webhook
        for (const item of order.products) {
          const prodId = item.productData?._id;
          const variantId = item.variant?._id;
          if (prodId && variantId) {
            await Product.updateOne(
              { _id: prodId, 'variants._id': variantId },
              { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } }
            );
          } else if (prodId) {
            await Product.findByIdAndUpdate(prodId, { $inc: { stock: -item.quantity } });
          }
        }

        if (order.discount?.code) {
          await Discount.updateOne({ code: order.discount.code }, { $inc: { usedCount: 1 } });
        }

        await order.save();

        const customer = await User.findById(order.user.userId);
        if (customer) {
          await customer.clearCart();
        }
      }
    }

    if (isSuccess) {
      return res.redirect(`http://localhost:5173/orders?payment=success&orderId=${merchantOrderId || ''}`);
    } else {
      const msg = encodeURIComponent(data['data.message'] || 'Payment failed or was declined.');
      return res.redirect(`http://localhost:5173/checkout?payment=failed&message=${msg}`);
    }
  } catch (err) {
    console.error('[Paymob Callback Redirection Error]:', err);
    return res.redirect('http://localhost:5173/orders');
  }
});

module.exports = router;
