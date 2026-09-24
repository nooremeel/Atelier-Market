const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const addressSchema = new Schema({
    street:     { type: String, default: '' },
    city:       { type: String, default: '' },
    country:    { type: String, default: '' },
    postalCode: { type: String, default: '' },
}, { _id: false });

const addressBookItemSchema = new Schema({
    label:      { type: String, default: 'Home' },
    name:       { type: String, default: '' },
    street:     { type: String, required: true },
    city:       { type: String, required: true },
    country:    { type: String, required: true },
    postalCode: { type: String, default: '' },
    phone:      { type: String, default: '' },
    isDefault:  { type: Boolean, default: false },
}, { timestamps: true });

const savedCardSchema = new Schema({
    cardholderName: { type: String, default: '' },
    last4:          { type: String, default: '' },
    brand:          { type: String, default: '' },
    expiry:         { type: String, default: '' },
}, { _id: false });

const sellerProfileSchema = new Schema({
    shopName:        { type: String, default: '' },
    shopDescription: { type: String, default: '' },
    shopBanner:      { type: String, default: '' },  // image URL
    location: {
        city:    { type: String, default: '' },
        country: { type: String, default: '' },
        lat:     { type: Number, default: null },
        lng:     { type: Number, default: null },
    },
    joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new Schema({
    name:  { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer',
    },

    avatar:    { type: String, default: '' },  // image URL or initials placeholder
    phone:     { type: String, default: '' },
    address:   { type: addressSchema, default: () => ({}) },
    addresses: [addressBookItemSchema],

    // Default payment preference and tokenized card metadata (PCI-safe)
    defaultPaymentMethod: {
        type: String,
        enum: ['card', 'apple_pay', 'cash_on_delivery'],
        default: 'card',
    },
    savedCard: { type: savedCardSchema, default: null },

    // Saved / wishlisted products
    favourites: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

    // Seller-only profile (null for customers)
    sellerProfile: { type: sellerProfileSchema, default: null },

    // Shopping cart (existing)
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity:  { type: Number, required: true },
                variantId: { type: Schema.Types.ObjectId, default: null },
            }
        ]
    },

    // Password reset
    resetToken:  String,
    resetTokenExpire: Date,
}, { timestamps: true });

// ---------- Cart methods (enhanced with variant support) ----------

userSchema.methods.addToCart = function (product, variantId = null, quantity = 1) {
    const variantIdStr = variantId ? variantId.toString() : null;
    const cartProductIndex = this.cart.items.findIndex(cp => {
        const matchesProduct = cp.productId.toString() === product._id.toString();
        const itemVariantStr = cp.variantId ? cp.variantId.toString() : null;
        return matchesProduct && itemVariantStr === variantIdStr;
    });
    const updatedCartItems = [...this.cart.items];
    const addQty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    if (cartProductIndex >= 0) {
        updatedCartItems[cartProductIndex].quantity += addQty;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: addQty,
            variantId: variantId ? new mongoose.Types.ObjectId(variantIdStr) : null,
        });
    }
    this.cart = { items: updatedCartItems };
    return this.save();
};

userSchema.methods.removeFromCart = function (productId, variantId = null) {
    const variantIdStr = variantId ? variantId.toString() : null;
    const updatedCartItems = this.cart.items.filter(item => {
        const matchesProduct = item.productId.toString() === productId.toString();
        const itemVariantStr = item.variantId ? item.variantId.toString() : null;
        if (variantIdStr !== null) {
            return !(matchesProduct && itemVariantStr === variantIdStr);
        }
        return !matchesProduct;
    });
    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
};

// ---------- Favourites helpers ----------

userSchema.methods.isFavourite = function (productId) {
    const prodIdStr = productId.toString();
    return this.favourites.some(id => (id?._id || id).toString() === prodIdStr);
};

userSchema.methods.toggleFavourite = async function (productId) {
    const prodIdStr = productId.toString();
    const isFav = this.isFavourite(productId);

    if (isFav) {
        await this.constructor.updateOne(
            { _id: this._id },
            { $pull: { favourites: new mongoose.Types.ObjectId(prodIdStr) } }
        );
        this.favourites = this.favourites.filter(id => (id?._id || id).toString() !== prodIdStr);
        return false;
    } else {
        await this.constructor.updateOne(
            { _id: this._id },
            { $addToSet: { favourites: new mongoose.Types.ObjectId(prodIdStr) } }
        );
        if (!this.isFavourite(productId)) {
            this.favourites.push(new mongoose.Types.ObjectId(prodIdStr));
        }
        return true;
    }
};

module.exports = mongoose.model('User', userSchema);