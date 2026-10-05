/**
 * @file controllers/shop.js
 * @description Facade module re-exporting domain-specific controllers (products, cart, orders)
 *              for backward compatibility.
 */

const productsController = require('./products');
const cartController = require('./cart');
const ordersController = require('./orders');
const { reconcilePendingPaymobOrders } = require('../services/orderService');
const { serializeCart } = require('../services/cartService');

module.exports = {
  // Products
  getProducts: productsController.getProducts,
  getProduct: productsController.getProduct,

  // Cart
  getCart: cartController.getCart,
  postCart: cartController.postCart,
  postCartDeleteProduct: cartController.postCartDeleteProduct,
  postCartDecrement: cartController.postCartDecrement,
  getCheckout: cartController.getCheckout,
  serializeCart,

  // Orders
  postOrder: ordersController.postOrder,
  getOrders: ordersController.getOrders,
  getInvoice: ordersController.getInvoice,
  reconcilePendingPaymobOrders,
};