const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isSellerOrAdmin = require('../middleware/require-role')('seller', 'admin');
const isAdmin = require('../middleware/require-role')('admin');
const { body } = require('express-validator');

const productValidators = [
  body('title').trim().notEmpty().withMessage('Please enter a valid title'),
  body('price').isFloat().withMessage('Please enter a valid price'),
  body('description').trim()
    .isLength({ min: 5 }).withMessage('Description must be at least 5 characters')
    .isLength({ max: 400 }).withMessage('Description must be at most 400 characters'),
  body('stock').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('lowStockThreshold').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Low stock threshold must be at least 1'),
];

// ─── Platform Admin Dedicated Operations (Admin Only) ────────────────────────
router.get('/admin/stats', isAdmin, adminController.getAdminStats);
router.get('/admin/orders', isAdmin, adminController.getAdminOrders);
router.get('/admin/artisans', isAdmin, adminController.getAdminArtisans);

// ─── Product Management (Seller & Admin) ─────────────────────────────────────
router.get('/admin/products', isSellerOrAdmin, adminController.getProducts);
router.get('/admin/products/:productId', isSellerOrAdmin, adminController.getAdminProduct);
router.post('/admin/products', isSellerOrAdmin, productValidators, adminController.postAddProduct);
router.put('/admin/products/:productId', isSellerOrAdmin, productValidators, adminController.postEditProduct);
router.delete('/admin/products/:productId', isSellerOrAdmin, adminController.deleteProduct);
router.post('/admin/products/:productId/discount', isSellerOrAdmin, adminController.postProductDiscount);
router.delete('/admin/products/:productId/discount', isSellerOrAdmin, adminController.deleteProductDiscount);

exports.routes = router;
