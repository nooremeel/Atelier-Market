/**
 * @file services/productService.js
 * @description Domain logic for catalog pieces: filtering, pagination, search, sorting,
 *              product detail retrieval, and seller/admin product management.
 */

const Product = require('../models/product');
const fileHelper = require('../util/file');

const ITEMS_PER_PAGE = 6;

const SORTS = {
  price_asc:  { price: 1, _id: -1 },
  price_desc: { price: -1, _id: -1 },
  title_asc:  { title: 1, _id: -1 },
  newest:     { createdAt: -1, _id: -1 },
  rating:     { 'ratings.average': -1, 'ratings.count': -1, _id: -1 },
};

/**
 * Builds a MongoDB filter object from request query parameters.
 *
 * @param {object} query - Express req.query object.
 * @returns {object} MongoDB filter expression.
 */
function buildProductFilter(query = {}) {
  const q         = (query.q || '').trim();
  const category  = (query.category || '').trim();
  const badge     = (query.badge || '').trim();
  const sellerId  = (query.sellerId || '').trim();
  const minPrice  = query.minPrice !== undefined ? Number(query.minPrice) : undefined;
  const maxPrice  = query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;
  const minRating = query.minRating !== undefined ? Number(query.minRating) : undefined;

  const filter = {};

  if (q) {
    filter.$or = [
      { title:       { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags:        { $elemMatch: { $regex: q, $options: 'i' } } },
    ];
  }

  if (category) filter.category = category;
  if (badge)    filter.badge = badge;
  if (sellerId) filter.userId = sellerId;

  if (!Number.isNaN(minPrice) && minPrice !== undefined) {
    filter.price = { ...(filter.price || {}), $gte: minPrice };
  }
  if (!Number.isNaN(maxPrice) && maxPrice !== undefined) {
    filter.price = { ...(filter.price || {}), $lte: maxPrice };
  }
  if (!Number.isNaN(minRating) && minRating !== undefined) {
    filter['ratings.average'] = { $gte: minRating };
  }

  return filter;
}

/**
 * Retrieves a paginated list of catalog products based on query filters and sorting.
 *
 * @param {object} query - Filter & pagination options from request query.
 * @returns {Promise<{ products: Array, pagination: object }>}
 */
async function getProducts(query = {}) {
  const page = Math.max(1, +query.page || 1);
  const itemsPerPage = query.limit ? Math.min(50, Math.max(1, +query.limit)) : ITEMS_PER_PAGE;
  const filter = buildProductFilter(query);
  const sort = SORTS[query.sort] || SORTS.newest;

  const totalItems = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sort)
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage);

  const lastPage = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return {
    products,
    pagination: {
      currentPage: page,
      totalItems,
      lastPage,
      hasNextPage: itemsPerPage * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
    },
  };
}

/**
 * Retrieves a single product by its MongoDB _id, populated with artisan seller details.
 *
 * @param {string} productId - Product ObjectId.
 * @returns {Promise<import('../models/product').ProductDocument|null>}
 */
async function getProductById(productId) {
  return Product.findById(productId).populate('userId', 'name avatar sellerProfile email');
}

/**
 * Serializes a product document for admin/seller management responses with artisan attribution.
 *
 * @param {import('../models/product').ProductDocument} p
 * @returns {object}
 */
function serializeAdminProduct(p, fallbackUser) {
  const isPopulated = p.userId && typeof p.userId === 'object' && p.userId._id;
  const userObj = isPopulated ? p.userId : (fallbackUser && typeof fallbackUser === 'object' ? fallbackUser : null);
  const artisan = userObj
    ? {
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        shopName: userObj.sellerProfile?.shopName || userObj.name,
      }
    : null;

  return {
    _id: p._id,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    discount: p.discount || { type: 'percentage', value: 0, isActive: false },
    badge: p.badge,
    description: p.description,
    imageUrl: p.imageUrl,
    userId: isPopulated ? p.userId._id : p.userId,
    artisan,
    category: p.category,
    stock: p.stock !== undefined ? p.stock : 20,
    lowStockThreshold: p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5,
    isAvailable: p.isAvailable !== undefined ? p.isAvailable : true,
  };
}

/**
 * Creates and persists a new catalog piece for an artisan seller.
 *
 * @param {import('../models/user').UserDocument} user
 * @param {object} productData
 * @param {string} imagePath
 * @returns {Promise<object>} Serialized admin product.
 */
async function createProduct(user, productData, imagePath) {
  const { title, price, description, stock, lowStockThreshold, category, badge } = productData;
  const newProduct = {
    title,
    price: Number(price),
    description,
    imageUrl: imagePath,
    userId: user._id,
    category,
    badge,
  };

  if (stock !== undefined && stock !== '') newProduct.stock = Number(stock);
  if (lowStockThreshold !== undefined && lowStockThreshold !== '') {
    newProduct.lowStockThreshold = Number(lowStockThreshold);
  }

  const saved = await new Product(newProduct).save();
  await saved.populate('userId', 'name email sellerProfile');
  return serializeAdminProduct(saved, user);
}

/**
 * Retrieves a product for admin inspection with ownership verification.
 *
 * @param {string} productId
 * @param {import('../models/user').UserDocument} user
 * @returns {Promise<object>} Serialized admin product.
 */
async function getAdminProductById(productId, user) {
  const product = await Product.findById(productId).populate('userId', 'name email sellerProfile');
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const isOwner =
    (product.userId._id ? product.userId._id.toString() : product.userId.toString()) ===
    user._id.toString();

  if (!isOwner && user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }

  return serializeAdminProduct(product);
}

/**
 * Updates product attributes, optionally replacing its image.
 *
 * @param {string} productId
 * @param {import('../models/user').UserDocument} user
 * @param {object} updateData
 * @param {string} [newImagePath]
 * @returns {Promise<object>}
 */
async function updateProduct(productId, user, updateData, newImagePath) {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const isOwner = product.userId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }

  const { title, price, description, stock, lowStockThreshold, isAvailable } = updateData;
  product.title = title;
  product.price = Number(price);
  product.description = description;

  if (stock !== undefined && stock !== '') product.stock = Number(stock);
  if (lowStockThreshold !== undefined && lowStockThreshold !== '') {
    product.lowStockThreshold = Number(lowStockThreshold);
  }
  if (isAvailable !== undefined) {
    product.isAvailable = isAvailable === 'true' || isAvailable === true;
  }
  if (newImagePath) {
    fileHelper.deleteFile(product.imageUrl);
    product.imageUrl = newImagePath;
  }

  const saved = await product.save();
  await saved.populate('userId', 'name email sellerProfile');
  return serializeAdminProduct(saved, user);
}

/**
 * Deletes a product and its associated stored image.
 *
 * @param {string} productId
 * @param {import('../models/user').UserDocument} user
 * @returns {Promise<void>}
 */
async function deleteProductById(productId, user) {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const isOwner = product.userId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }

  fileHelper.deleteFile(product.imageUrl);
  await Product.deleteOne({ _id: productId });
}

/**
 * Applies a percentage or fixed discount to a product.
 *
 * @param {string} productId
 * @param {import('../models/user').UserDocument} user
 * @param {{ type: string, value: number }} discountData
 * @returns {Promise<object>}
 */
async function applyProductDiscount(productId, user, { type, value }) {
  if (!type || !['percentage', 'fixed'].includes(type)) {
    const error = new Error('Invalid discount type. Must be percentage or fixed.');
    error.status = 422;
    throw error;
  }
  const numericValue = Number(value);
  if (isNaN(numericValue) || numericValue <= 0) {
    const error = new Error('Discount value must be greater than zero.');
    error.status = 422;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const isOwner = product.userId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }

  const originalPrice = product.compareAtPrice != null ? product.compareAtPrice : product.price;

  let discountedPrice;
  if (type === 'percentage') {
    if (numericValue >= 100) {
      const error = new Error('Percentage discount must be less than 100%.');
      error.status = 422;
      throw error;
    }
    discountedPrice = Math.round(originalPrice * (1 - numericValue / 100) * 100) / 100;
  } else {
    if (numericValue >= originalPrice) {
      const error = new Error('Fixed discount must be less than the product price.');
      error.status = 422;
      throw error;
    }
    discountedPrice = Math.round((originalPrice - numericValue) * 100) / 100;
  }

  product.compareAtPrice = originalPrice;
  product.price = discountedPrice;
  product.badge = 'sale';
  product.discount = {
    type,
    value: numericValue,
    isActive: true,
  };

  const saved = await product.save();
  await saved.populate('userId', 'name email sellerProfile');
  return serializeAdminProduct(saved, user);
}

/**
 * Removes discount pricing from a product, restoring compareAtPrice.
 *
 * @param {string} productId
 * @param {import('../models/user').UserDocument} user
 * @returns {Promise<object>}
 */
async function removeProductDiscount(productId, user) {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const isOwner = product.userId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }

  if (product.compareAtPrice != null) {
    product.price = product.compareAtPrice;
    product.compareAtPrice = null;
  }
  if (product.badge === 'sale') {
    product.badge = '';
  }
  product.discount = {
    type: 'percentage',
    value: 0,
    isActive: false,
  };

  const saved = await product.save();
  await saved.populate('userId', 'name email sellerProfile');
  return serializeAdminProduct(saved, user);
}

/**
 * Lists products filtered for seller management or cross-seller platform admin inspection.
 *
 * @param {import('../models/user').UserDocument} user
 * @param {string} [sellerIdFilter]
 * @returns {Promise<Array<object>>}
 */
async function getAdminProducts(user, sellerIdFilter) {
  const isAdmin = user.role === 'admin';
  const filter = {};
  if (!isAdmin) {
    filter.userId = user._id;
  } else if (sellerIdFilter) {
    filter.userId = sellerIdFilter;
  }

  const products = await Product.find(filter)
    .populate('userId', 'name email sellerProfile')
    .sort({ createdAt: -1 });

  return products.map(serializeAdminProduct);
}

module.exports = {
  buildProductFilter,
  getProducts,
  getProductById,
  serializeAdminProduct,
  createProduct,
  getAdminProductById,
  updateProduct,
  deleteProductById,
  applyProductDiscount,
  removeProductDiscount,
  getAdminProducts,
};
