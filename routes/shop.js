const path = require('path');
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');


router.get('/', shopController.getIndex);
router.get('/cart', isAuth, shopController.getCart);
router.post('/cart', isAuth, shopController.postCart);

router.get('/product-list', shopController.getProducts);
router.get('/product-list/:productId', shopController.getProduct);

router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
router.post('/create-order', isAuth, shopController.postOrder);
router.get('/checkout', isAuth, shopController.getCheckout);
router.get('/orders', isAuth, shopController.getOrders);
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);
module.exports = router;