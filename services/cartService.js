/**
 * @file services/cartService.js
 * @description Domain logic for customer shopping cart: serialization, variant handling,
 *              inventory scarcity checks, and line item mutations.
 */

const Product = require('../models/product');

/**
 * Serializes a user's populated cart with unit pricing, variant information, and inventory limits.
 *
 * @param {import('../models/user').UserDocument} user - User document with populated cart.items.productId.
 * @returns {{ items: Array, totalItems: number, totalPrice: number }}
 */
function serializeCart(user) {
  if (!user || !user.cart || !Array.isArray(user.cart.items)) {
    return { items: [], totalItems: 0, totalPrice: 0 };
  }

  const items = user.cart.items
    .filter((i) => i.productId)
    .map((i) => {
      const prod = i.productId;
      const variantIdStr = i.variantId ? i.variantId.toString() : null;
      let variant = null;
      let unitPrice = prod.price;
      let availableStock = prod.stock !== undefined ? prod.stock : 20;

      if (variantIdStr && Array.isArray(prod.variants)) {
        const found = prod.variants.find((v) => v._id.toString() === variantIdStr);
        if (found) {
          variant = {
            _id: found._id,
            name: found.name,
            sku: found.sku,
            price: found.price,
            compareAtPrice: found.compareAtPrice,
            stock: found.stock,
          };
          if (typeof found.price === 'number') {
            unitPrice = found.price;
          }
          if (typeof found.stock === 'number') {
            availableStock = found.stock;
          }
        }
      }

      return {
        _id: i._id,
        product: prod,
        quantity: i.quantity,
        variantId: variantIdStr,
        variant,
        unitPrice,
        stock: availableStock,
      };
    });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce(
    (s, i) => s + i.quantity * (i.unitPrice !== undefined ? i.unitPrice : i.product.price),
    0
  );

  return { items, totalItems, totalPrice: Math.round(totalPrice * 100) / 100 };
}

/**
 * Retrieves the current user's cart populated with product references.
 *
 * @param {import('../models/user').UserDocument} user
 * @returns {Promise<{ items: Array, totalItems: number, totalPrice: number }>}
 */
async function getCart(user) {
  const populatedUser = await user.populate('cart.items.productId');
  return serializeCart(populatedUser);
}

/**
 * Adds an item (and optional variant) to the user's cart, verifying stock limits.
 *
 * @param {import('../models/user').UserDocument} user
 * @param {object} params
 * @param {string} params.productId
 * @param {string} [params.variantId]
 * @param {number} [params.quantity=1]
 * @returns {Promise<{ items: Array, totalItems: number, totalPrice: number }>}
 */
async function addToCart(user, { productId, variantId, quantity }) {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const addQty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
  let selectedVariant = null;
  let availableStock = product.stock !== undefined ? product.stock : 20;

  const variantIdStr = variantId ? String(variantId) : null;
  if (variantIdStr && Array.isArray(product.variants)) {
    selectedVariant = product.variants.find((v) => v._id.toString() === variantIdStr);
    if (!selectedVariant) {
      const error = new Error('Selected variant not found');
      error.status = 400;
      throw error;
    }
    if (typeof selectedVariant.stock === 'number') {
      availableStock = selectedVariant.stock;
    }
  }

  if (availableStock <= 0 || product.isAvailable === false) {
    const error = new Error('This handcrafted item is currently sold out');
    error.status = 400;
    throw error;
  }

  const existing = user.cart.items.find((i) => {
    const matchProd = i.productId.toString() === product._id.toString();
    const matchVar = (i.variantId ? i.variantId.toString() : null) === variantIdStr;
    return matchProd && matchVar;
  });

  const currentQty = existing ? existing.quantity : 0;
  if (currentQty + addQty > availableStock) {
    const error = new Error(`Only ${availableStock} pieces available in studio`);
    error.status = 400;
    throw error;
  }

  await user.addToCart(product, variantIdStr, addQty);
  const populatedUser = await user.populate('cart.items.productId');
  return serializeCart(populatedUser);
}

/**
 * Removes a product line item entirely from the user's cart.
 *
 * @param {import('../models/user').UserDocument} user
 * @param {object} params
 * @param {string} params.productId
 * @param {string} [params.variantId]
 * @returns {Promise<{ items: Array, totalItems: number, totalPrice: number }>}
 */
async function removeFromCart(user, { productId, variantId }) {
  await user.removeFromCart(productId, variantId || null);
  const populatedUser = await user.populate('cart.items.productId');
  return serializeCart(populatedUser);
}

/**
 * Decrements an item's quantity in the cart or removes it if quantity reaches 0.
 *
 * @param {import('../models/user').UserDocument} user
 * @param {object} params
 * @param {string} params.productId
 * @param {string} [params.variantId]
 * @returns {Promise<{ items: Array, totalItems: number, totalPrice: number }>}
 */
async function decrementCartItem(user, { productId, variantId }) {
  const id = String(productId);
  const variantIdStr = variantId ? String(variantId) : null;

  const line = user.cart.items.find((i) => {
    const matchProd = String(i.productId) === id;
    const matchVar = (i.variantId ? String(i.variantId) : null) === variantIdStr;
    return matchProd && matchVar;
  });

  if (!line) {
    const populatedUser = await user.populate('cart.items.productId');
    return serializeCart(populatedUser);
  }

  if (line.quantity <= 1) {
    user.cart.items = user.cart.items.filter((i) => {
      const matchProd = String(i.productId) === id;
      const matchVar = (i.variantId ? String(i.variantId) : null) === variantIdStr;
      return !(matchProd && matchVar);
    });
  } else {
    line.quantity -= 1;
  }

  await user.save();
  const populatedUser = await user.populate('cart.items.productId');
  return serializeCart(populatedUser);
}

module.exports = {
  serializeCart,
  getCart,
  addToCart,
  removeFromCart,
  decrementCartItem,
};
