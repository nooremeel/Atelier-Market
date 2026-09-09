const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator');


const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SANDGRID_API_KEY
    }
}));

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ errorMessage: 'Invalid email or password.', validationErrors: [] });
      }
      return bcrypt.compare(password, user.password).then((match) => {
        if (!match) {
          return res.status(422).json({ errorMessage: 'Invalid email or password.', validationErrors: [] });
        }
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save(() => res.json({ user: { _id: user._id, email: user.email } }));
      });
    })
    .catch((err) => next(new Error(err)));
};

exports.postSignup = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  bcrypt
    .hash(password, 12)
    .then((hashed) => new User({ email, password: hashed, cart: { items: [] } }).save())
    .then((user) => res.status(201).json({ user: { _id: user._id, email: user.email } }))
    .catch((err) => next(new Error(err)));
};

exports.postLogout = (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
};

exports.postReset = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) return res.status(500).json({ message: 'Could not start reset' });
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) return null;
        user.resetToken = token;
        user.resetTokenExpire = Date.now() + 3600000;
        return user.save();
      })
      .then(() => res.json({ ok: true }))
      .catch((e) => next(new Error(e)));
  });
};

exports.getResetToken = (req, res, next) => {
  User.findOne({ resetToken: req.params.token, resetTokenExpire: { $gt: Date.now() } })
    .then((user) => {
      if (!user) return res.status(404).json({ message: 'This reset link is invalid or expired' });
      res.json({ email: user.email, userId: user._id.toString() });
    })
    .catch((e) => next(new Error(e)));
};

exports.postChangePassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }
  const { password: newPassword, userId, passwordToken } = req.body;
  let resetUser;
  User.findOne({ resetToken: passwordToken, resetTokenExpire: { $gt: Date.now() }, _id: userId })
    .then((user) => {
      if (!user) {
        res.status(422).json({ errorMessage: 'This reset link is invalid or expired' });
        return null;
      }
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashed) => {
      if (!hashed) return null;
      resetUser.password = hashed;
      resetUser.resetToken = null;
      resetUser.resetTokenExpire = undefined;
      return resetUser.save().then(() => res.json({ ok: true }));
    })
    .catch((e) => next(new Error(e)));
};
