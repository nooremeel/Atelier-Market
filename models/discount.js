const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discountSchema = new Schema({
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    maxDiscount: {
        type: Number,
        default: null,
    },
    startDate: {
        type: Date,
        default: null,
    },
    endDate: {
        type: Date,
        default: null,
    },
    usageLimit: {
        type: Number,
        default: null,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    sellerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, { timestamps: true });

discountSchema.index({ isActive: 1 });

module.exports = mongoose.model('Discount', discountSchema);
