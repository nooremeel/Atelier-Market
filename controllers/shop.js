const Product = require('../models/product');
const Order = require('../models/order');
const order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PAGLOCK } = require('sequelize/lib/table-hints');

const ITEMS_PER_PAGE = 4;

const SORTS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  title_asc: { title: 1 },
  newest: { _id: -1 },
};

function buildProductQuery(req) {
  const q = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
  const filter = {};
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }
  if (category) filter.title = { $regex: category, $options: 'i' };
  if (!Number.isNaN(minPrice) && minPrice !== undefined) filter.price = { ...(filter.price || {}), $gte: minPrice };
  if (!Number.isNaN(maxPrice) && maxPrice !== undefined) filter.price = { ...(filter.price || {}), $lte: maxPrice };
  return filter;
}

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  const filter = buildProductQuery(req);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  let totalItems;
  Product.find(filter)
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Product.find(filter)
        .sort(sort)
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.json({
        products,
        pagination: {
          currentPage: page,
          totalItems,
          lastPage: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
        },
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .then((product) => {
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json({ product });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => exports.getProducts(req, res, next);

function serializeCart(user) {
  const items = user.cart.items
    .filter((i) => i.productId)
    .map((i) => ({ product: i.productId, quantity: i.quantity }));
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.quantity * i.product.price, 0);
  return { items, totalItems, totalPrice };
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCart = (req, res, next) => {
  Product.findById(req.body.productId)
    .then((product) => {
      if (!product) return null;
      return req.user.addToCart(product);
    })
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCartDeleteProduct = (req, res, next) => {
  req.user
    .removeFromCart(req.body.productId)
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postCartDecrement = (req, res, next) => {
  const id = String(req.body.productId);
  const line = req.user.cart.items.find((i) => String(i.productId) === id);
  if (!line) {
    return req.user
      .populate('cart.items.productId')
      .then((user) => res.json(serializeCart(user)));
  }
  if (line.quantity <= 1) {
    req.user.cart.items = req.user.cart.items.filter((i) => String(i.productId) !== id);
  } else {
    line.quantity -= 1;
  }
  req.user
    .save()
    .then(() => req.user.populate('cart.items.productId'))
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => res.json(serializeCart(user)))
    .catch((err) => next(new Error(err)));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const lines = user.cart.items.filter((i) => i.productId);
      if (lines.length === 0) {
        res.status(400).json({ message: 'Your cart is empty' });
        return null;
      }
      const products = lines.map((i) => ({
        quantity: i.quantity,
        productData: { ...i.productId._doc },
      }));
      const totalPrice = lines.reduce((s, i) => s + i.quantity * i.productId.price, 0);
      const order = new Order({
        user: { email: req.user.email, userId: req.user._id },
        products,
        totalPrice,
      });
      return order.save().then((saved) =>
        req.user.clearCart().then(() =>
          res.status(201).json({
            order: { _id: saved._id, totalPrice: saved.totalPrice, products: saved.products },
          }),
        ),
      );
    })
    .catch((err) => next(new Error(err)));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .sort({ _id: -1 })
    .then((orders) => res.json({ orders }))
    .catch((err) => next(new Error(err)));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join(__dirname, '..', 'data', 'invoices', invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(32).text('Invoice', {
        underline: true,
        align: 'center'
      });
      pdfDoc.fontSize(26).text('--------------------------------------------', {

        align: 'center'
      });
      order.products.forEach(product => {
        pdfDoc.fontSize(18).text(product.productData.title + ' - ' + product.quantity + ' x $' + product.productData.price, {

          align: 'center'
        });
      });
      pdfDoc.fontSize(26).text('--------------------------------------------', {

        align: 'center'
      });
      pdfDoc.fontSize(22).text('Total Price: $' + order.totalPrice, {

        align: 'center'
      });
      pdfDoc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {

      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      //   res.send(data);
      // });

    })
    .catch(err => {
      next(err)
    });

};