const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const variantSchema = new Schema({
    name:           { type: String, required: true }, // e.g. "Small / 250ml", "Standard Studio Edition"
    sku:            { type: String, default: '' },
    price:          { type: Number, required: true },
    compareAtPrice: { type: Number, default: null },
    stock:          { type: Number, default: 10, min: 0 },
});

const productSchema = new Schema({
    title:          { type: String, required: true },
    price:          { type: Number, required: true },
    compareAtPrice: { type: Number, default: null },   // original price when on sale
    discount: {
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: Number, default: 0 },
        isActive: { type: Boolean, default: false },
    },
    description:    { type: String, required: true },
    imageUrl:       { type: String, required: true },
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Catalogue metadata
    category: {
        type: String,
        enum: ['ceramics', 'leather', 'glass', 'books', 'textiles', 'metals', 'paper', 'other'],
        default: 'other',
    },
    tags:  { type: [String], default: [] },
    badge: {
        type: String,
        enum: ['new', 'bestseller', 'limited', 'sale', ''],
        default: '',
    },
    stock: { type: Number, default: 20, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 1 },
    isAvailable: { type: Boolean, default: true },
    variants: [variantSchema],

    // Denormalised rating summary (updated when a review is saved)
    ratings: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count:   { type: Number, default: 0, min: 0 },
    },

    // Seller / origin location
    location: {
        city:    { type: String, default: '' },
        country: { type: String, default: '' },
        lat:     { type: Number, default: null },
        lng:     { type: Number, default: null },
    },
}, { timestamps: true });

// Full-text search index over title + description + tags
productSchema.index({ title: 'text', description: 'text', tags: 'text' }, { name: 'product_text' });
// Category filter index
productSchema.index({ category: 1 });
// Price index for range queries & sort
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);