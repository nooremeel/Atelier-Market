const { validationResult } = require('express-validator');
const Product = require('../models/product');
const fileHelper = require('../util/file');

function publicProduct(p) {
  return { _id: p._id, title: p.title, price: p.price, description: p.description, imageUrl: p.imageUrl, userId: p.userId };
}

exports.postAddProduct = (req, res, next) => {
  const { title, price, description } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(422).json({ errorMessage: 'Attached file is not a valid image (png/jpg/jpeg).', validationErrors: [] });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  new Product({ title, price, description, imageUrl: image.path, userId: req.user._id })
    .save()
    .then((p) => res.status(201).json({ product: publicProduct(p) }))
    .catch((err) => next(new Error(err)));
};

exports.getAdminProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      res.json({ product: publicProduct(product) });
    })
    .catch((err) => next(new Error(err)));
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  const { title, price, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      product.title = title;
      product.price = price;
      product.description = description;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then((p) => res.json({ product: publicProduct(p) }));
    })
    .catch((err) => next(new Error(err)));
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => res.json({ products: products.map(publicProduct) }))
    .catch((err) => next(new Error(err)));
};

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: productId, userId: req.user._id })
        .then(() => res.status(200).json({ message: 'Product deleted' }));
    })
    .catch(() => res.status(500).json({ message: 'Delete failed' }));
};
