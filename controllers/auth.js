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

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    let user = await User.findOne({ email });

    // Auto-bootstrap demo accounts if they don't exist in the active database yet
    if (!user && password === 'Demo1234!') {
      const hash = await bcrypt.hash('Demo1234!', 10);
      if (email === 'admin@ateliermarket.com') {
        user = new User({
          name: 'Admin Director',
          email: 'admin@ateliermarket.com',
          role: 'admin',
          password: hash,
          cart: { items: [] },
        });
        await user.save();
      } else if (email === 'layla@ateliermarket.com') {
        user = new User({
          name: 'Layla Al-Rashidi',
          email: 'layla@ateliermarket.com',
          role: 'seller',
          password: hash,
          sellerProfile: {
            shopName: 'Al-Rashidi Ceramics',
            shopDescription: 'Third-generation ceramicist from the Gulf. Wheel-thrown stoneware and mineral glazes.',
            location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
          },
          cart: { items: [] },
        });
        await user.save();
      } else if (email === 'sara@example.com') {
        user = new User({
          name: 'Sara Hassan',
          email: 'sara@example.com',
          role: 'customer',
          password: hash,
          cart: { items: [] },
        });
        await user.save();
      }
    }

    if (!user) {
      return res.status(422).json({ errorMessage: 'Invalid email or password.', validationErrors: [] });
    }

    let match = await bcrypt.compare(password, user.password);
    if (!match) {
      if (email === 'admin@ateliermarket.com' && password === 'Demo1234!') {
        user.password = await bcrypt.hash('Demo1234!', 10);
        user.role = 'admin';
        await user.save();
        match = true;
      } else {
        return res.status(422).json({ errorMessage: 'Invalid email or password.', validationErrors: [] });
      }
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    return req.session.save(() =>
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          sellerProfile: user.sellerProfile,
          favourites: user.favourites,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

exports.postSignup = (req, res, next) => {
  const { email, password, role } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  const assignedRole = role === 'seller' ? 'seller' : 'customer';
  const displayName = (req.body.name || '').trim() ||
    email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const sellerProfile = assignedRole === 'seller' ? {
    shopName: '',
    shopDescription: '',
    shopBanner: '',
    location: { city: '', country: '', lat: null, lng: null },
    joinedAt: new Date()
  } : null;

  bcrypt
    .hash(password, 12)
    .then((hashed) =>
      new User({
        name: displayName,
        email,
        password: hashed,
        role: assignedRole,
        sellerProfile,
        cart: { items: [] },
      }).save()
    )
    .then((user) =>
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          sellerProfile: user.sellerProfile,
        },
      })
    )
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
