/**
 * @file controllers/cart.js
 * @description Thin controller for shopping cart operations: inspection, adding items,
 *              line item quantity decrements, and removals. Delegates to cartService.
 */

const { validationResult } = require('express-validator');
const cartService = require('../services/cartService');
const orderService = require('../services/orderService');

/**
 * GET /api/cart
 * Returns serialized cart for the authenticated customer.
 */
exports.getCart = async (req, res, next) => {
  try {
    await orderService.reconcilePendingPaymobOrders(req.user._id);
    const cart = await cartService.getCart(req.user);
    return res.json(cart);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cart
 * Adds an item or variant to the cart.
 */
exports.postCart = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    const { productId, variantId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user, { productId, variantId, quantity });
    return res.json(cart);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

/**
 * POST /api/cart/delete
 * Removes a product line item entirely from the cart.
 */
exports.postCartDeleteProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    const { productId, variantId } = req.body;
    const cart = await cartService.removeFromCart(req.user, { productId, variantId });
    return res.json(cart);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cart/decrement
 * Decrements the quantity of an item in the cart or removes it if 0.
 */
exports.postCartDecrement = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    const { productId, variantId } = req.body;
    const cart = await cartService.decrementCartItem(req.user, { productId, variantId });
    return res.json(cart);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/checkout
 * Pre-checkout cart summary.
 */
exports.getCheckout = async (req, res, next) => {
  try {
    await orderService.reconcilePendingPaymobOrders(req.user._id);
    const cart = await cartService.getCart(req.user);
    return res.json(cart);
  } catch (err) {
    next(err);
  }
};
