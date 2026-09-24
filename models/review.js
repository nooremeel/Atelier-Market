const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId:    { type: Schema.Types.ObjectId, ref: 'User',    required: true },
    userName:  { type: String, default: '' },
    userAvatar:{ type: String, default: '' },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    title:     { type: String, required: true, maxlength: 120 },
    body:      { type: String, required: true, maxlength: 2000 },
    verified:  { type: Boolean, default: false }, // true if user purchased the product
}, { timestamps: true });

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
