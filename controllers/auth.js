/**
 * @file controllers/auth.js
 * @description Thin auth controller. Validates input, delegates all business
 *              logic to authService, manages the session, and returns HTTP
 *              responses. No raw DB queries or bcrypt calls live here.
 */

const { validationResult } = require('express-validator');
const authService = require('../services/authService');

// ---------------------------------------------------------------------------
// Login / Logout
// ---------------------------------------------------------------------------

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    const user = await authService.authenticateUser(email, password);
    if (!user) {
      return res.status(422).json({ errorMessage: 'Invalid email or password.', validationErrors: [] });
    }

    // Session: store only the minimal footprint required for auth middleware
    req.session.isLoggedIn = true;
    req.session.user = { _id: user._id, role: user.role };
    await new Promise((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        sellerProfile: user.sellerProfile,
        favourites: user.favourites,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.postLogout = (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
};

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

exports.postSignup = async (req, res, next) => {
  const { email, password, role } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    const user = await authService.createUser({ email, password, name: req.body.name, role });
    return res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerProfile: user.sellerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

exports.postReset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    // Always returns ok:true — prevents email enumeration attacks
    await authService.initiatePasswordReset(req.body.email);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.getResetToken = async (req, res, next) => {
  try {
    const result = await authService.validateResetToken(req.params.token);
    if (!result) {
      return res.status(404).json({ message: 'This reset link is invalid or expired' });
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.postChangePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
  }

  try {
    const { password: newPassword, userId, passwordToken } = req.body;
    const success = await authService.changePassword(userId, passwordToken, newPassword);
    if (!success) {
      return res.status(422).json({ errorMessage: 'This reset link is invalid or expired' });
    }
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
