const Discount = require('../models/discount');

exports.postValidateDiscount = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Please provide a discount code.' });
    }
    const cleanCode = code.trim().toUpperCase();
    const numericSubtotal = Number(subtotal) || 0;

    const discount = await Discount.findOne({ code: cleanCode });
    if (!discount || !discount.isActive) {
      return res.status(404).json({ valid: false, message: 'Invalid or inactive promo code.' });
    }

    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      return res.status(400).json({ valid: false, message: 'This promo code is not yet active.' });
    }
    if (discount.endDate && now > discount.endDate) {
      return res.status(400).json({ valid: false, message: 'This promo code has expired.' });
    }
    if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({ valid: false, message: 'This promo code has reached its maximum redemptions.' });
    }
    if (numericSubtotal < discount.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `A minimum order amount of $${discount.minOrderAmount.toFixed(2)} is required to use this code.`,
      });
    }

    let amount = 0;
    if (discount.discountType === 'percentage') {
      amount = Math.round((numericSubtotal * (discount.discountValue / 100)) * 100) / 100;
      if (discount.maxDiscount && amount > discount.maxDiscount) {
        amount = discount.maxDiscount;
      }
    } else {
      amount = Math.min(numericSubtotal, discount.discountValue);
    }

    const finalTotal = Math.max(0, Math.round((numericSubtotal - amount) * 100) / 100);

    return res.json({
      valid: true,
      discount: {
        code: discount.code,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        amount,
      },
      subtotal: numericSubtotal,
      finalTotal,
    });
  } catch (err) {
    next(new Error(err));
  }
};

exports.getDiscounts = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { $or: [{ sellerId: req.user._id }, { sellerId: null }] };

    const discounts = await Discount.find(query).sort({ createdAt: -1 });
    res.json({ discounts });
  } catch (err) {
    next(new Error(err));
  }
};

exports.postCreateDiscount = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(422).json({ message: 'Promo code is required.' });
    }
    const cleanCode = code.trim().toUpperCase();

    const existing = await Discount.findOne({ code: cleanCode });
    if (existing) {
      return res.status(422).json({ message: `Promo code "${cleanCode}" already exists.` });
    }

    const numericValue = Number(discountValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      return res.status(422).json({ message: 'Discount value must be greater than zero.' });
    }
    if (discountType === 'percentage' && numericValue > 100) {
      return res.status(422).json({ message: 'Percentage discount cannot exceed 100%.' });
    }

    const discount = new Discount({
      code: cleanCode,
      description: description ? description.trim() : '',
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: numericValue,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      sellerId: req.user.role === 'admin' ? (req.body.sellerId || null) : req.user._id,
      isActive: true,
    });

    const saved = await discount.save();
    res.status(201).json({ message: 'Promo code created successfully.', discount: saved });
  } catch (err) {
    next(new Error(err));
  }
};

exports.patchToggleDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Promo code not found.' });
    }
    if (req.user.role !== 'admin' && (!discount.sellerId || discount.sellerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to modify this promo code.' });
    }

    discount.isActive = !discount.isActive;
    const saved = await discount.save();
    res.json({ message: `Promo code ${saved.isActive ? 'activated' : 'deactivated'}.`, discount: saved });
  } catch (err) {
    next(new Error(err));
  }
};

exports.deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Promo code not found.' });
    }
    if (req.user.role !== 'admin' && (!discount.sellerId || discount.sellerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this promo code.' });
    }

    await Discount.deleteOne({ _id: req.params.id });
    res.json({ message: 'Promo code deleted successfully.' });
  } catch (err) {
    next(new Error(err));
  }
};
