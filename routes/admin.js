const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');

const productValidators = [
  body('title').trim().notEmpty().withMessage('Please enter a valid title'),
  body('price').isFloat().withMessage('Please enter a valid price'),
  body('description').trim()
    .isLength({ min: 5 }).withMessage('Description must be at least 5 characters')
    .isLength({ max: 400 }).withMessage('Description must be at most 400 characters'),
];

router.get('/admin/products', isAuth, adminController.getProducts);
router.get('/admin/products/:productId', isAuth, adminController.getAdminProduct);
router.post('/admin/products', isAuth, productValidators, adminController.postAddProduct);
router.put('/admin/products/:productId', isAuth, productValidators, adminController.postEditProduct);
router.delete('/admin/products/:productId', isAuth, adminController.deleteProduct);

exports.routes = router;
