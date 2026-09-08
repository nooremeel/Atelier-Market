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

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpsStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpsStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .removeFromCart(productId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpsStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const totalPrice = user.cart.items.reduce((sum, i) => {
        return sum + i.quantity * i.productId.price;
      }, 0);
      const products = user.cart.items;
      res.render('shop/checkout', {
        path: 'checkout',
        pageTitle: 'checkout',
        products: products,
        totalSum: totalPrice
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpsStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items.map(i => {
        return {
          quantity: i.quantity,
          productData: { ...i.productId._doc }
        };
      });

      const totalPrice = user.cart.items.reduce((sum, i) => {
        return sum + i.quantity * i.productId.price;
      }, 0);

      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products,
        totalPrice: totalPrice
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpsStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpsStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('no order found'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized access'));
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