const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const isAuth = require('../middleware/is-auth');
const isSellerOrAdmin = require('../middleware/require-role')('seller', 'admin');

// Public/Shopper validation endpoint
router.post('/discounts/validate', isAuth, discountController.postValidateDiscount);

// Seller/Admin management endpoints
router.get('/discounts', isSellerOrAdmin, discountController.getDiscounts);
router.post('/discounts', isSellerOrAdmin, discountController.postCreateDiscount);
router.patch('/discounts/:id', isSellerOrAdmin, discountController.patchToggleDiscount);
router.delete('/discounts/:id', isSellerOrAdmin, discountController.deleteDiscount);

module.exports = router;
