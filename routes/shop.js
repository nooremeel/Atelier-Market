const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const validateProductId = [body('productId').isMongoId().withMessage('Invalid product')];

router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
router.get('/cart', isAuth, shopController.getCart);
router.post('/cart', isAuth, validateProductId, shopController.postCart);
router.post('/cart/delete', isAuth, validateProductId, shopController.postCartDeleteProduct);
router.post('/cart/decrement', isAuth, validateProductId, shopController.postCartDecrement);
router.get('/checkout', isAuth, shopController.getCheckout);
router.post('/orders', isAuth, shopController.postOrder);
router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:orderId/invoice', isAuth, shopController.getInvoice);

module.exports = router;
