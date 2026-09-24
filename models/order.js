const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    products: [{
        productData: { type: Object, required: true },
        quantity:    { type: Number, required: true },
        variant:     { type: Object, default: null },
    }],
    user: {
        email:  { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
        name:   { type: String, default: '' },
    },
    subtotal:    { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: {
        code:          { type: String, default: '' },
        discountType:  { type: String, default: '' },
        discountValue: { type: Number, default: 0 },
        amount:        { type: Number, default: 0 },
    },
    totalPrice: { type: Number, required: true },

    // Order lifecycle
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'crafting', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },

    // Payment (mock-friendly: no real gateway required)
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid',
    },
    paymentMethod:    { type: String, default: 'card' },  // 'card' | 'cash_on_delivery'
    paymentReference: { type: String, default: '' },      // mock reference / Stripe PI id when real

    // Shipping & Delivery Tracking
    shippingAddress: {
        name:       { type: String, default: '' },
        street:     { type: String, default: '' },
        city:       { type: String, default: '' },
        country:    { type: String, default: '' },
        postalCode: { type: String, default: '' },
    },
    carrier: { type: String, default: 'Aramex White-Glove Express' },
    trackingNumber: { type: String, default: '' },
    estimatedDeliveryDate: { type: Date },
    timeline: [{
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
    }],

    // Notes
    notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);