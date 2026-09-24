const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();

const Product = require('../models/product');
const Review  = require('../models/review');
const Order   = require('../models/order');
const isAuth  = require('../middleware/is-auth');

// ─── Product search suggestions ────────────────────────────────────────────
// GET /api/products/suggestions?q=text
router.get('/products/suggestions', async (req, res, next) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q || q.length < 2) return res.json({ suggestions: [] });

        const docs = await Product.find(
            { $or: [
                { title:       { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags:        { $regex: q, $options: 'i' } },
            ]},
            { title: 1, category: 1, imageUrl: 1, price: 1 }
        ).limit(6).lean();

        res.json({ suggestions: docs });
    } catch (err) { next(err); }
});

// ─── Favourites ─────────────────────────────────────────────────────────────

// GET /api/favourites — list user's favourited products
router.get('/favourites', isAuth, async (req, res, next) => {
    try {
        const user = await req.user.populate('favourites');
        const seen = new Set();
        const uniqueFavourites = (user.favourites || []).filter(item => {
            if (!item || !item._id) return false;
            const id = item._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        res.json({ favourites: uniqueFavourites });
    } catch (err) { next(err); }
});

// POST /api/favourites — toggle favourite { productId }
router.post('/favourites',
    isAuth,
    body('productId').isMongoId().withMessage('Invalid product'),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(422).json({ errorMessage: errors.array()[0].msg });

            const product = await Product.findById(req.body.productId);
            if (!product) return res.status(404).json({ message: 'Product not found' });

            await req.user.toggleFavourite(req.body.productId);
            const isFav = req.user.isFavourite(req.body.productId);
            res.json({ favourited: isFav, count: req.user.favourites.length });
        } catch (err) { next(err); }
    }
);

// ─── Reviews ─────────────────────────────────────────────────────────────────

// GET /api/products/:productId/reviews?page=
router.get('/products/:productId/reviews', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }
        const productIdObj = new mongoose.Types.ObjectId(req.params.productId);
        const page  = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 10;

        const productPromise = Product.findById(productIdObj).select('ratings').lean();
        const reviewsPromise = Review.find({ productId: productIdObj })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'name email avatar')
            .lean();
        const totalPromise = Review.countDocuments({ productId: productIdObj });
        const aggPromise = Review.aggregate([
            { $match: { productId: productIdObj } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
        ]);

        const [product, reviews, total, aggStats] = await Promise.all([
            productPromise,
            reviewsPromise,
            totalPromise,
            aggPromise,
        ]);

        // Build distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        aggStats.forEach((item) => {
            if (distribution[item._id] !== undefined) {
                distribution[item._id] = item.count;
                sum += item._id * item.count;
            }
        });

        let average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
        let totalCount = total;

        // Fallback for legacy seeded products where Review docs may be empty but product.ratings exist
        if (total === 0 && product?.ratings && product.ratings.count > 0) {
            average = product.ratings.average;
            totalCount = product.ratings.count;
            const highStars = Math.min(5, Math.max(1, Math.round(product.ratings.average)));
            const highCount = Math.round(totalCount * 0.7);
            const midCount = Math.round(totalCount * 0.2);
            const otherCount = Math.max(0, totalCount - highCount - midCount);
            distribution[highStars] = highCount;
            const nextStar = highStars > 1 ? highStars - 1 : 2;
            distribution[nextStar] = midCount;
            if (otherCount > 0) {
                const thirdStar = nextStar > 1 ? nextStar - 1 : 1;
                distribution[thirdStar] = otherCount;
            }
        }

        // Check if authenticated user has reviewed or purchased
        let userHasReviewed = false;
        let isVerifiedPurchaser = false;
        if (req.user) {
            const [existingUserRev, hasOrder] = await Promise.all([
                Review.findOne({ productId: productIdObj, userId: req.user._id }),
                Order.findOne({
                    'user.userId': req.user._id,
                    $or: [
                        { 'products.productData._id': productIdObj },
                        { 'products.productData._id': req.params.productId },
                    ],
                    $and: [
                        {
                            $or: [
                                { paymentStatus: 'paid' },
                                { status: { $in: ['confirmed', 'shipped', 'delivered'] } },
                            ],
                        },
                    ],
                }),
            ]);
            userHasReviewed = !!existingUserRev;
            isVerifiedPurchaser = !!hasOrder;
        }

        res.json({
            reviews,
            pagination: {
                currentPage: page,
                lastPage: Math.max(1, Math.ceil(total / limit)),
                totalItems: total,
            },
            stats: {
                average,
                total: totalCount,
                distribution,
            },
            userHasReviewed,
            isVerifiedPurchaser,
        });
    } catch (err) { next(err); }
});

// POST /api/products/:productId/reviews
router.post('/products/:productId/reviews',
    isAuth,
    [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
        body('title').trim().isLength({ min: 2, max: 120 }).withMessage('Title is too short'),
        body('body').trim().isLength({ min: 10, max: 2000 }).withMessage('Review is too short'),
        body('name').optional().trim().isLength({ max: 100 }),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
                return res.status(400).json({ message: 'Invalid product id' });
            }

            const product = await Product.findById(req.params.productId);
            if (!product) return res.status(404).json({ message: 'Product not found' });

            // Check for duplicate
            const existing = await Review.findOne({ productId: product._id, userId: req.user._id });
            if (existing) return res.status(409).json({ message: 'You have already reviewed this product' });

            // Check verified purchase
            const hasOrder = await Order.findOne({
                'user.userId': req.user._id,
                $or: [
                    { 'products.productData._id': product._id },
                    { 'products.productData._id': product._id.toString() },
                ],
                $and: [
                    {
                        $or: [
                            { paymentStatus: 'paid' },
                            { status: { $in: ['confirmed', 'shipped', 'delivered'] } },
                        ],
                    },
                ],
            });

            const authorName = (req.body.name || req.user.name || '').trim();
            const authorAvatar = req.user.avatar || '';

            const review = await Review.create({
                productId: product._id,
                userId:    req.user._id,
                userName:  authorName,
                userAvatar: authorAvatar,
                rating:    Number(req.body.rating),
                title:     req.body.title.trim(),
                body:      req.body.body.trim(),
                verified:  !!hasOrder,
            });

            // Update user profile name if previously empty
            if ((!req.user.name || !req.user.name.trim()) && authorName) {
                req.user.name = authorName;
                await req.user.save();
            }

            // Recalculate denormalised rating on product
            const agg = await Review.aggregate([
                { $match: { productId: product._id } },
                { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } },
            ]);
            if (agg.length) {
                product.ratings.average = Math.round(agg[0].avg * 10) / 10;
                product.ratings.count   = agg[0].cnt;
                await product.save();
            }

            await review.populate('userId', 'name email avatar');

            res.status(201).json({ review });
        } catch (err) {
            if (err.code === 11000) return res.status(409).json({ message: 'You have already reviewed this product' });
            next(err);
        }
    }
);

// DELETE /api/reviews/:reviewId — own review or admin
router.delete('/reviews/:reviewId', isAuth, async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        const isOwner = review.userId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorised' });

        await review.deleteOne();

        // Recalculate
        const agg = await Review.aggregate([
            { $match: { productId: review.productId } },
            { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } },
        ]);
        await Product.findByIdAndUpdate(review.productId, {
            'ratings.average': agg.length ? Math.round(agg[0].avg * 10) / 10 : 0,
            'ratings.count':   agg.length ? agg[0].cnt : 0,
        });

        res.json({ message: 'Review deleted' });
    } catch (err) { next(err); }
});

// ─── Account — profile & address ────────────────────────────────────────────

// GET /api/account/profile
router.get('/account/profile', isAuth, (req, res) => {
    const { _id, name, email, role, avatar, phone, address, addresses, sellerProfile, favourites, defaultPaymentMethod, savedCard, createdAt } = req.user;
    res.json({ user: { _id, name, email, role, avatar, phone, address, addresses: addresses || [], sellerProfile, favourites, defaultPaymentMethod: defaultPaymentMethod || 'card', savedCard: savedCard || null, createdAt } });
});

// PATCH /api/account/profile
router.patch('/account/profile',
    isAuth,
    [
        body('name').optional().trim().isLength({ max: 100 }),
        body('phone').optional().trim().isLength({ max: 30 }),
        body('avatar').optional().trim(),
        body('defaultPaymentMethod').optional().isIn(['card', 'apple_pay', 'cash_on_delivery']),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(422).json({ errorMessage: errors.array()[0].msg });

            const allowed = ['name', 'phone', 'avatar', 'defaultPaymentMethod'];
            allowed.forEach(f => { if (req.body[f] !== undefined) req.user[f] = req.body[f]; });

            if (req.body.savedCard !== undefined) {
                req.user.savedCard = req.body.savedCard;
            }

            if (req.file) {
                req.user.avatar = '/' + req.file.path.replace(/\\/g, '/').replace(/^\/+/, '');
            }

            if (req.body.address) {
                req.user.address = { ...req.user.address.toObject?.() ?? req.user.address, ...req.body.address };
            }

            // Seller profile fields
            if (req.user.role === 'seller' && req.body.sellerProfile) {
                req.user.sellerProfile = { ...(req.user.sellerProfile ?? {}), ...req.body.sellerProfile };
            }

            await req.user.save();
            const { _id, name, email, role, avatar, phone, address, addresses, sellerProfile, favourites, defaultPaymentMethod, savedCard, createdAt } = req.user;
            res.json({ user: { _id, name, email, role, avatar, phone, address, addresses: addresses || [], sellerProfile, favourites, defaultPaymentMethod: defaultPaymentMethod || 'card', savedCard: savedCard || null, createdAt } });
        } catch (err) { next(err); }
    }
);

// GET /api/account/addresses — list all saved addresses
router.get('/account/addresses', isAuth, (req, res) => {
    res.json({ addresses: req.user.addresses || [] });
});

// POST /api/account/addresses — add a new address
router.post('/account/addresses',
    isAuth,
    [
        body('street').trim().notEmpty().withMessage('Street is required'),
        body('city').trim().notEmpty().withMessage('City is required'),
        body('country').trim().notEmpty().withMessage('Country is required'),
        body('postalCode').optional().trim(),
        body('name').optional().trim(),
        body('phone').optional().trim(),
        body('label').optional().trim(),
        body('isDefault').optional().isBoolean(),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });

            if (!req.user.addresses) req.user.addresses = [];

            const isFirst = req.user.addresses.length === 0;
            const makeDefault = req.body.isDefault === true || isFirst;

            if (makeDefault) {
                req.user.addresses.forEach(a => { a.isDefault = false; });
            }

            const newAddress = {
                label: (req.body.label || 'Home').trim(),
                name: (req.body.name || req.user.name || '').trim(),
                street: req.body.street.trim(),
                city: req.body.city.trim(),
                country: req.body.country.trim(),
                postalCode: (req.body.postalCode || '').trim(),
                phone: (req.body.phone || req.user.phone || '').trim(),
                isDefault: makeDefault,
            };

            req.user.addresses.push(newAddress);

            // Sync user.address if this is default
            if (makeDefault) {
                req.user.address = {
                    street: newAddress.street,
                    city: newAddress.city,
                    country: newAddress.country,
                    postalCode: newAddress.postalCode,
                };
            }

            await req.user.save();
            const created = req.user.addresses[req.user.addresses.length - 1];
            res.status(201).json({ address: created, addresses: req.user.addresses });
        } catch (err) { next(err); }
    }
);

// PATCH /api/account/addresses/:addressId — update address or set as default
router.patch('/account/addresses/:addressId',
    isAuth,
    [
        body('street').optional().trim().notEmpty().withMessage('Street cannot be empty'),
        body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
        body('country').optional().trim().notEmpty().withMessage('Country cannot be empty'),
        body('postalCode').optional().trim(),
        body('name').optional().trim(),
        body('phone').optional().trim(),
        body('label').optional().trim(),
        body('isDefault').optional().isBoolean(),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(422).json({ errorMessage: errors.array()[0].msg, validationErrors: errors.array() });

            if (!mongoose.Types.ObjectId.isValid(req.params.addressId)) {
                return res.status(400).json({ message: 'Invalid address ID' });
            }

            const addr = req.user.addresses?.id(req.params.addressId);
            if (!addr) return res.status(404).json({ message: 'Address not found' });

            const fields = ['label', 'name', 'street', 'city', 'country', 'postalCode', 'phone'];
            fields.forEach(f => {
                if (req.body[f] !== undefined) addr[f] = req.body[f].trim();
            });

            if (req.body.isDefault === true) {
                req.user.addresses.forEach(a => {
                    a.isDefault = a._id.toString() === addr._id.toString();
                });
                req.user.address = {
                    street: addr.street,
                    city: addr.city,
                    country: addr.country,
                    postalCode: addr.postalCode,
                };
            }

            await req.user.save();
            res.json({ address: addr, addresses: req.user.addresses });
        } catch (err) { next(err); }
    }
);

// DELETE /api/account/addresses/:addressId — delete saved address
router.delete('/account/addresses/:addressId',
    isAuth,
    async (req, res, next) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.addressId)) {
                return res.status(400).json({ message: 'Invalid address ID' });
            }

            const addr = req.user.addresses?.id(req.params.addressId);
            if (!addr) return res.status(404).json({ message: 'Address not found' });

            const wasDefault = addr.isDefault;
            req.user.addresses.pull(req.params.addressId);

            if (wasDefault && req.user.addresses.length > 0) {
                req.user.addresses[0].isDefault = true;
                req.user.address = {
                    street: req.user.addresses[0].street,
                    city: req.user.addresses[0].city,
                    country: req.user.addresses[0].country,
                    postalCode: req.user.addresses[0].postalCode,
                };
            } else if (req.user.addresses.length === 0) {
                req.user.address = { street: '', city: '', country: '', postalCode: '' };
            }

            await req.user.save();
            res.json({ message: 'Address removed', addresses: req.user.addresses });
        } catch (err) { next(err); }
    }
);

// ─── Sellers directory ────────────────────────────────────────────────────────

// GET /api/sellers — list all seller accounts (public, for map)
const User = require('../models/user');
router.get('/sellers', async (req, res, next) => {
    try {
        const sellers = await User.find({ role: 'seller' })
            .select('name avatar sellerProfile email')
            .lean();
        res.json({ sellers });
    } catch (err) { next(err); }
});

// GET /api/sellers/:id — single seller public profile
router.get('/sellers/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid seller id' });
        }
        const seller = await User.findOne({ _id: req.params.id, role: { $in: ['seller', 'admin'] } })
            .select('name avatar sellerProfile email createdAt')
            .lean();
        if (!seller) return res.status(404).json({ message: 'Seller not found' });

        // Return seller's products too
        const products = await Product.find({ userId: req.params.id }).lean();
        res.json({ seller, products });
    } catch (err) { next(err); }
});

// ─── File Uploads ─────────────────────────────────────────────────────────────

// POST /api/upload — upload an image file (auth required)
router.post('/upload', isAuth, (req, res) => {
    if (!req.file) {
        return res.status(422).json({ message: 'No valid image file uploaded. Supported formats: PNG, JPG, JPEG, WEBP.' });
    }
    const relativePath = '/' + req.file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    res.status(201).json({ imageUrl: relativePath });
});

module.exports = router;
