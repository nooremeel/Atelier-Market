/**
 * @file services/authService.js
 * @description Business logic for authentication: user lookup, demo account bootstrapping,
 *              password verification, user creation, and password reset lifecycle.
 *              All DB queries and bcrypt operations live here; the controller
 *              is responsible only for session management and HTTP responses.
 */

const crypto = require('crypto');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const randomBytesAsync = promisify(crypto.randomBytes);

// ---------------------------------------------------------------------------
// Login helpers
// ---------------------------------------------------------------------------

/**
 * Look up a user by email.
 * @param {string} email
 * @returns {Promise<import('../models/user').UserDocument|null>}
 */
async function findUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Provisions a missing demo account when DEMO_MODE is enabled and the
 * incoming password matches the shared demo credential.
 * Only creates accounts for the three known demo email addresses.
 *
 * @param {string} email
 * @param {string} password - The raw password supplied by the login request.
 * @returns {Promise<import('../models/user').UserDocument|null>} The newly
 *   created user document, or null if conditions are not met.
 */
async function bootstrapDemoUser(email, password) {
  if (process.env.DEMO_MODE !== 'true' || password !== 'Demo1234!') return null;

  const hash = await bcrypt.hash('Demo1234!', 10);

  const demoProfiles = {
    'admin@ateliermarket.com': {
      name: 'Admin Director',
      email: 'admin@ateliermarket.com',
      role: 'admin',
      password: hash,
      cart: { items: [] },
    },
    'layla@ateliermarket.com': {
      name: 'Layla Al-Rashidi',
      email: 'layla@ateliermarket.com',
      role: 'seller',
      password: hash,
      sellerProfile: {
        shopName: 'Al-Rashidi Ceramics',
        shopDescription:
          'Third-generation ceramicist from the Gulf. Wheel-thrown stoneware and mineral glazes.',
        location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
      },
      cart: { items: [] },
    },
    'sara@example.com': {
      name: 'Sara Hassan',
      email: 'sara@example.com',
      role: 'customer',
      password: hash,
      cart: { items: [] },
    },
  };

  const profile = demoProfiles[email];
  if (!profile) return null;

  return new User(profile).save();
}

/**
 * Verifies the supplied password against the stored hash.
 * In DEMO_MODE, if the admin password has drifted (e.g. after a DB restore),
 * it is silently re-synced to the demo credential.
 *
 * @param {import('../models/user').UserDocument} user
 * @param {string} password - Raw password from the login request.
 * @returns {Promise<boolean>} True if authentication should be granted.
 */
async function verifyPassword(user, password) {
  const match = await bcrypt.compare(password, user.password);
  if (match) return true;

  // Demo-mode admin password drift recovery
  if (
    process.env.DEMO_MODE === 'true' &&
    user.email === 'admin@ateliermarket.com' &&
    password === 'Demo1234!'
  ) {
    user.password = await bcrypt.hash('Demo1234!', 10);
    user.role = 'admin';
    await user.save();
    return true;
  }

  return false;
}

/**
 * Looks up a user by email, and if missing in DEMO_MODE, auto-provisions
 * the matching demo persona.
 *
 * @param {string} email
 * @param {string} password - Raw password from login request.
 * @returns {Promise<import('../models/user').UserDocument|null>}
 */
async function findOrBootstrapDemoUser(email, password) {
  let user = await findUserByEmail(email);
  if (!user) {
    user = await bootstrapDemoUser(email, password);
  }
  return user;
}

/**
 * Authenticates a user with email and password. Handles demo account
 * auto-bootstrapping and password comparison.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('../models/user').UserDocument|null>} Returns the user on success, null on failure.
 */
async function authenticateUser(email, password) {
  const user = await findOrBootstrapDemoUser(email, password);
  if (!user) return null;

  const authenticated = await verifyPassword(user, password);
  if (!authenticated) return null;

  return user;
}

// ---------------------------------------------------------------------------
// Signup helper
// ---------------------------------------------------------------------------

/**
 * Creates and persists a new user account.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password - Raw password; hashed here before storage.
 * @param {string} [params.name]
 * @param {'customer'|'seller'} [params.role]
 * @returns {Promise<import('../models/user').UserDocument>}
 */
async function createUser({ email, password, name, role }) {
  const assignedRole = role === 'seller' ? 'seller' : 'customer';
  const displayName =
    (name || '').trim() ||
    email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const sellerProfile =
    assignedRole === 'seller'
      ? {
          shopName: '',
          shopDescription: '',
          shopBanner: '',
          location: { city: '', country: '', lat: null, lng: null },
          joinedAt: new Date(),
        }
      : null;

  const hashed = await bcrypt.hash(password, 12);
  return new User({
    name: displayName,
    email,
    password: hashed,
    role: assignedRole,
    sellerProfile,
    cart: { items: [] },
  }).save();
}

// ---------------------------------------------------------------------------
// Password reset helpers
// ---------------------------------------------------------------------------

/**
 * Generates a secure reset token and writes it to the user document.
 * If no user with the given email exists, this is a no-op — the controller
 * always responds with { ok: true } to prevent email enumeration.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
async function initiatePasswordReset(email) {
  const buffer = await randomBytesAsync(32);
  const token = buffer.toString('hex');

  const user = await User.findOne({ email });
  if (user) {
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 3_600_000; // 1 hour
    await user.save();
  }
}

/**
 * Validates a password-reset token and returns the matching user's safe data.
 *
 * @param {string} token
 * @returns {Promise<{ email: string, userId: string }|null>}
 */
async function validateResetToken(token) {
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpire: { $gt: Date.now() },
  });
  if (!user) return null;
  return { email: user.email, userId: user._id.toString() };
}

/**
 * Applies a new hashed password to the user identified by both userId and
 * the valid reset token, then clears the token fields.
 *
 * @param {string} userId
 * @param {string} passwordToken
 * @param {string} newPassword - Raw new password; hashed here before storage.
 * @returns {Promise<boolean>} False if the token is invalid or expired.
 */
async function changePassword(userId, passwordToken, newPassword) {
  const user = await User.findOne({
    resetToken: passwordToken,
    resetTokenExpire: { $gt: Date.now() },
    _id: userId,
  });
  if (!user) return false;

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetToken = null;
  user.resetTokenExpire = undefined;
  await user.save();
  return true;
}

module.exports = {
  findUserByEmail,
  bootstrapDemoUser,
  findOrBootstrapDemoUser,
  verifyPassword,
  authenticateUser,
  createUser,
  initiatePasswordReset,
  validateResetToken,
  changePassword,
};
