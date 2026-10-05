/**
 * @file controllers/adminController.js
 * @description Thin controller for platform admin analytics and seller product management.
 *              Delegates all business logic and database queries to adminService and productService.
 */

const { validationResult } = require('express-validator');
const adminService = require('../services/adminService');
const productService = require('../services/productService');

// ─── Platform Admin Analytics & Overview ─────────────────────────────────────

/**
 * GET /api/admin/stats
 * Returns platform GMV, user counts, recent orders, and top artisan rankings.
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    const data = await adminService.getPlatformStats();
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/orders
 * Returns all cross-platform orders for administrative inspection.
 */
exports.getAdminOrders = async (req, res, next) => {
  try {
    const orders = await adminService.getAllOrders();
    return res.json({ orders });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/artisans
 * Returns directory of registered artisan studios with piece counts.
 */
exports.getAdminArtisans = async (req, res, next) => {
  try {
    const artisans = await adminService.getArtisansDirectory();
    return res.json({ artisans });
  } catch (err) {
    next(err);
  }
};

// ─── Product Management (Admin & Seller) ─────────────────────────────────────

/**
 * POST /api/admin/products
 * Creates a new catalog piece for the authenticated seller.
 */
exports.postAddProduct = async (req, res, next) => {
  const image = req.file;
  if (!image) {
    return res.status(422).json({
      errorMessage: 'Attached file is not a valid image (png/jpg/jpeg).',
      validationErrors: [],
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  try {
    const product = await productService.createProduct(req.user, req.body, image.path);
    return res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/products/:productId
 * Retrieves product details for editing with ownership guard.
 */
exports.getAdminProduct = async (req, res, next) => {
  try {
    const product = await productService.getAdminProductById(req.params.productId, req.user);
    return res.json({ product });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

/**
 * PUT /api/admin/products/:productId
 * Updates an owned product.
 */
exports.postEditProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  try {
    const product = await productService.updateProduct(
      req.params.productId,
      req.user,
      req.body,
      req.file ? req.file.path : undefined
    );
    return res.json({ product });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/admin/products
 * Lists products for the current seller or all products if admin.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const products = await productService.getAdminProducts(req.user, req.query.sellerId);
    return res.json({ products });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/products/:productId
 * Deletes a product with ownership verification.
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProductById(req.params.productId, req.user);
    return res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Delete failed' });
  }
};

/**
 * POST /api/admin/products/:productId/discount
 * Applies promotional discount pricing to a product.
 */
exports.postProductDiscount = async (req, res, next) => {
  try {
    const product = await productService.applyProductDiscount(
      req.params.productId,
      req.user,
      req.body
    );
    return res.json({ message: 'Discount applied successfully', product });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

/**
 * DELETE /api/admin/products/:productId/discount
 * Removes promotional discount from a product.
 */
exports.deleteProductDiscount = async (req, res, next) => {
  try {
    const product = await productService.removeProductDiscount(
      req.params.productId,
      req.user
    );
    return res.json({ message: 'Discount removed successfully', product });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};
