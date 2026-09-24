// ─── Core domain types ────────────────────────────────────────────────────────

export type ProductCategory = 'ceramics' | 'leather' | 'glass' | 'books' | 'textiles' | 'metals' | 'paper' | 'other';
export type ProductBadge    = 'new' | 'bestseller' | 'limited' | 'sale' | '';

export type ProductVariant = {
  _id: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
};

export type Product = {
  _id:         string;
  title:       string;
  price:       number;
  compareAtPrice?: number | null;
  discount?:   { type: 'percentage' | 'fixed'; value: number; isActive: boolean };
  description: string;
  imageUrl:    string;
  userId:      string;
  category?:   ProductCategory;
  tags?:       string[];
  badge?:      ProductBadge;
  stock?:      number;
  lowStockThreshold?: number;
  isAvailable?: boolean;
  variants?:   ProductVariant[];
  artisan?:    { _id: string; name: string; email?: string; shopName?: string } | null;
  ratings?:    { average: number; count: number };
  location?:   { city: string; country: string; lat?: number | null; lng?: number | null };
  createdAt?:  string;
};

export type Pagination = {
  currentPage:   number;
  lastPage:      number;
  hasNextPage:   boolean;
  hasPreviousPage: boolean;
  nextPage:      number;
  previousPage:  number;
  totalItems:    number;
};

export type CartLine = {
  _id?: string;
  product: Product;
  quantity: number;
  variantId?: string | null;
  variant?: ProductVariant | null;
  unitPrice?: number;
  stock?: number;
};
export type Cart = { items: CartLine[]; totalItems: number; totalPrice: number };

export type OrderStatus    = 'pending' | 'confirmed' | 'crafting' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus  = 'unpaid' | 'paid' | 'refunded';

export type OrderTimelineEvent = {
  status: OrderStatus;
  timestamp: string;
  note?: string;
};

export type ShippingAddress = {
  name:       string;
  street:     string;
  city:       string;
  country:    string;
  postalCode: string;
};

export type Order = {
  _id:             string;
  user?:           { _id: string; email: string; name?: string };
  subtotal?:       number;
  shippingFee?:    number;
  discount?:       { code: string; discountType: string; discountValue: number; amount: number };
  totalPrice:      number;
  products:        Array<{ productData: Product; quantity: number; variant?: ProductVariant | null }>;
  status?:         OrderStatus;
  paymentStatus?:  PaymentStatus;
  paymentMethod?:  string;
  shippingAddress?: ShippingAddress;
  carrier?:        string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  timeline?:       OrderTimelineEvent[];
  invoiceUrl?:     string;
  createdAt?:      string;
};

export interface Discount {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  sellerId?: string | null;
  createdAt?: string;
}

export interface AppliedDiscount {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  amount: number;
}

// ─── Auth & User ──────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'seller' | 'admin';

export type AddressBookItem = {
  _id:          string;
  label:        string;
  name?:        string;
  street:       string;
  city:         string;
  country:      string;
  postalCode?:  string;
  phone?:       string;
  isDefault:    boolean;
  createdAt?:   string;
  updatedAt?:   string;
};

export type SavedCard = {
  cardholderName?: string;
  last4?: string;
  brand?: string;
  expiry?: string;
};

export type SaveToProfileOptions = {
  saveContactInfo?: boolean;
  saveDefaultAddress?: boolean;
  saveDefaultPayment?: boolean;
};

export type UpdateProfilePayload = {
  name?:                 string;
  phone?:                string;
  avatar?:               string;
  defaultPaymentMethod?: 'card' | 'apple_pay' | 'cash_on_delivery';
  savedCard?:            SavedCard | null;
};

export type AddressPayload = {
  label?:      string;
  name?:       string;
  street:      string;
  city:        string;
  country:     string;
  postalCode?: string;
  phone?:      string;
  isDefault?:  boolean;
};

export type SellerProfile = {
  shopName:        string;
  shopDescription: string;
  shopBanner:      string;
  location?:       { city: string; country: string; lat?: number | null; lng?: number | null };
  joinedAt?:       string;
};

export type Artisan = {
  _id:             string;
  name:            string;
  email:           string;
  avatar?:         string;
  sellerProfile:   SellerProfile;
  createdAt?:      string;
};

export type SessionUser = {
  _id:                  string;
  email:                string;
  name?:                string;
  role?:                UserRole;
  avatar?:              string;
  phone?:               string;
  address?:             { street: string; city: string; country: string; postalCode: string };
  addresses?:           AddressBookItem[];
  defaultPaymentMethod?: 'card' | 'apple_pay' | 'cash_on_delivery';
  savedCard?:           SavedCard | null;
  favourites?:          string[];
  sellerProfile?:       SellerProfile;
  createdAt?:           string;
};

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type ReviewStats = {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

export type Review = {
  _id:         string;
  productId:   string;
  userId:      { _id: string; name?: string; email?: string; avatar?: string } | string;
  userName?:   string;
  userAvatar?: string;
  rating:      number;
  title:       string;
  body:        string;
  verified:    boolean;
  createdAt:   string;
};

// ─── Sellers ─────────────────────────────────────────────────────────────────

export type Seller = {
  _id:           string;
  name:          string;
  email:         string;
  avatar?:       string;
  sellerProfile: SellerProfile;
};

export type SellerStats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrdersCount: number;
  totalProducts: number;
  averageRating: number;
  totalReviews: number;
};

export type SellerRecentOrder = {
  _id: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  sellerTotal: number;
};

export type SellerOrder = {
  _id: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  timeline?: OrderTimelineEvent[];
  shippingAddress?: ShippingAddress;
  customer: {
    name: string;
    email: string;
  };
  products: Array<{ productData: Product; quantity: number; variant?: ProductVariant | null }>;
  sellerSubtotal: number;
  orderTotal: number;
};

// ─── Platform Admin ──────────────────────────────────────────────────────────

export type AdminKPIs = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrdersCount: number;
  totalProducts: number;
  totalArtisans: number;
  totalCustomers: number;
};

export type TopArtisan = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  shopName: string;
  location?: { city?: string; country?: string };
  productCount: number;
  grossSales: number;
  joinedAt?: string;
};

export type AdminStatsResponse = {
  stats: AdminKPIs;
  recentOrders: Array<{
    _id: string;
    createdAt: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    customerName: string;
    customerEmail: string;
    itemsCount: number;
    totalPrice: number;
  }>;
  topArtisans: TopArtisan[];
};

export type ArtisanDirectoryItem = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  sellerProfile?: SellerProfile;
  productCount: number;
  createdAt?: string;
};

