/**
 * @file controllers/products.js
 * @description Thin controller for public product catalog: listing, filtering, search,
 *              and piece details. Delegates all business logic to productService.
 */

const productService = require('../services/productService');

/**
 * GET /api/products
 * Returns a paginated list of catalog pieces.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:productId
 * Returns product details with artisan seller metadata.
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ product });
  } catch (err) {
    next(err);
  }
};
