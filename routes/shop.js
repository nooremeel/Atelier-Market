const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const shopController = require('../controllers/shop');
const isCustomerOrAdmin = require('../middleware/require-role')('customer', 'admin');

const validateProductId = [body('productId').isMongoId().withMessage('Invalid product')];

router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
router.get('/cart', isCustomerOrAdmin, shopController.getCart);
router.post('/cart', isCustomerOrAdmin, validateProductId, shopController.postCart);
router.post('/cart/delete', isCustomerOrAdmin, validateProductId, shopController.postCartDeleteProduct);
router.post('/cart/decrement', isCustomerOrAdmin, validateProductId, shopController.postCartDecrement);
router.get('/checkout', isCustomerOrAdmin, shopController.getCheckout);
router.post('/orders', isCustomerOrAdmin, shopController.postOrder);
router.get('/orders', isCustomerOrAdmin, shopController.getOrders);
router.get('/orders/:orderId/invoice', isCustomerOrAdmin, shopController.getInvoice);

module.exports = router;
