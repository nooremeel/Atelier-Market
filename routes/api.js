const express = require('express');
const meta = require('../controllers/api/meta');
const shopRoutes = require('./shop');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');

const router = express.Router();

router.get('/csrf-token', meta.getCsrfToken);
router.get('/auth/me', meta.getMe);
router.use('/auth', authRoutes);
router.use('/', shopRoutes);
router.use('/', adminRoutes.routes);

module.exports = router;
