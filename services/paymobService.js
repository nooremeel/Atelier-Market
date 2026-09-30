const crypto = require('crypto');

/**
 * Paymob Payment Gateway Service
 * 
 * Handles the 3-step Paymob authentication pipeline:
 *  1. Request ephemeral Auth Token using your secret API Key
 *  2. Register Order on Paymob with amount in piasters (cents) and line items
 *  3. Generate Payment Key for the specified Integration ID (Card 3DS)
 *  4. Construct the secure iFrame URL for modal / embedded checkout
 *  5. HMAC-SHA512 cryptographic verification for webhooks
 */

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

/**
 * Helper to check if we are in simulated sandbox mode.
 * Activates if PAYMOB_SANDBOX_MODE is 'true' or if keys are still default placeholders.
 */
function isSimulationMode() {
  const mode = process.env.PAYMOB_SANDBOX_MODE;
  const apiKey = process.env.PAYMOB_API_KEY || '';
  return mode === 'true' || apiKey.includes('placeholder') || !apiKey;
}

/**
 * Step 1: Request Authentication Token from Paymob
 * @returns {Promise<string>} The ephemeral JWT auth token (valid for ~1 hour)
 */
async function getAuthToken() {
  const apiKey = process.env.PAYMOB_API_KEY;

  if (isSimulationMode()) {
    console.log('[Paymob Sandbox] Step 1: Generated simulated Auth Token');
    return `simulated_auth_token_${Date.now()}`;
  }

  const response = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Paymob Auth Token failed (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Step 2: Register an Order on Paymob
 * @param {string} authToken - Auth token from Step 1
 * @param {Object} orderData
 * @param {number} orderData.amountCents - Total amount in cents/piasters (e.g. 500 EGP = 50000)
 * @param {string} orderData.merchantOrderId - Our internal MongoDB Order _id
 * @param {string} orderData.currency - Currency code (e.g. 'EGP')
 * @param {Array}  orderData.items - Order items list
 * @returns {Promise<number>} Paymob's numerical order ID
 */
async function registerPaymobOrder(authToken, { amountCents, merchantOrderId, currency = process.env.PAYMOB_CURRENCY || 'USD', items = [] }) {
  if (isSimulationMode()) {
    const simulatedOrderId = Math.floor(1000000 + Math.random() * 9000000);
    console.log(`[Paymob Sandbox] Step 2: Registered simulated Paymob Order ID: ${simulatedOrderId} for merchant order: ${merchantOrderId}`);
    return simulatedOrderId;
  }

  // Format line items to conform with Paymob's schema
  const formattedItems = items.map((i) => ({
    name: i.productData?.title || 'Marketplace Item',
    amount_cents: Math.round(((i.variant?.price ?? i.productData?.price) || 0) * 100),
    description: i.variant?.name || i.productData?.description?.slice(0, 100) || 'Artisan item',
    quantity: i.quantity || 1,
  }));

  const response = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: 'false',
      amount_cents: amountCents,
      currency: currency || process.env.PAYMOB_CURRENCY || 'EGP',
      merchant_order_id: merchantOrderId.toString(),
      items: formattedItems,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Paymob Order Registration failed (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.id; // Paymob numerical order ID
}

/**
 * Step 3: Request Payment Key (Token) for the selected Integration ID
 * @param {string} authToken - Auth token from Step 1
 * @param {Object} paymentParams
 * @param {number} paymentParams.paymobOrderId - Numerical ID from Step 2
 * @param {number} paymentParams.amountCents - Amount in cents/piasters
 * @param {string} paymentParams.currency - Currency code
 * @param {Object} paymentParams.billingData - Customer and shipping details
 * @returns {Promise<string>} The payment token string
 */
async function generatePaymentKey(authToken, { paymobOrderId, amountCents, currency = process.env.PAYMOB_CURRENCY || 'USD', billingData }) {
  const integrationId = process.env.PAYMOB_INTEGRATION_ID;

  if (isSimulationMode()) {
    const simulatedPaymentToken = `sim_payment_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[Paymob Sandbox] Step 3: Generated simulated Payment Key: ${simulatedPaymentToken}`);
    return simulatedPaymentToken;
  }

  // Paymob strictly requires all these fields in billing_data; fall back to 'NA' if absent
  const nameParts = (billingData.name || 'Artisan Patron').trim().split(' ');
  const firstName = nameParts[0] || 'Patron';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const payload = {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600, // Token valid for 1 hour
    order_id: paymobOrderId,
    billing_data: {
      first_name: firstName,
      last_name: lastName,
      email: billingData.email || 'customer@example.com',
      phone_number: billingData.phone || '+201000000000',
      street: billingData.street || 'NA',
      building: 'NA',
      floor: 'NA',
      apartment: 'NA',
      city: billingData.city || 'Cairo',
      country: billingData.country || 'EG',
      postal_code: billingData.postalCode || 'NA',
      state: 'NA',
    },
    currency: currency || process.env.PAYMOB_CURRENCY || 'EGP',
    integration_id: Number(integrationId),
    lock_order_when_paid: 'true',
  };

  const response = await fetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Paymob Payment Key failed (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Master Pipeline: Orchestrates Steps 1, 2, and 3
 * Converts total price to piasters, contacts Paymob, and returns the iFrame URL
 */
async function createCardPaymentSession({ orderId, totalPrice, currency = process.env.PAYMOB_CURRENCY || 'USD', billingData, items = [] }) {
  // Financial Gateways require integer cents: e.g. $25.50 -> 2550 cents
  const amountCents = Math.round(Number(totalPrice) * 100);
  const iframeId = process.env.PAYMOB_IFRAME_ID || '123456';

  console.log(`[Paymob Service] Initiating payment for Order ${orderId}: ${totalPrice} ${currency} (${amountCents} cents)`);

  // 1. Auth token
  const authToken = await getAuthToken();

  // 2. Order Registration
  const paymobOrderId = await registerPaymobOrder(authToken, {
    amountCents,
    merchantOrderId: orderId,
    currency,
    items,
  });

  // 3. Payment Key
  const paymentToken = await generatePaymentKey(authToken, {
    paymobOrderId,
    amountCents,
    currency,
    billingData,
  });

  // 4. Construct final iFrame URL
  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;

  return {
    success: true,
    isSimulation: isSimulationMode(),
    paymobOrderId,
    paymentToken,
    iframeUrl,
    iframeId,
    amountCents,
    currency,
  };
}

/**
 * Step 5 / Webhook: Verify Paymob HMAC SHA-512 Signature
 * 
 * Paymob signs the webhook payload by concatenating specific transaction fields
 * in exact alphabetical / lexical order, then hashing with your HMAC secret.
 * 
 * @param {Object} obj - The transaction object received from Paymob (req.body.obj)
 * @param {string} receivedHmac - The HMAC hash sent in req.query.hmac or headers
 * @returns {boolean} True if the signature is authentic and untampered
 */
function verifyHmacSignature(obj, receivedHmac) {
  if (isSimulationMode() && receivedHmac === 'simulated_valid_hmac') {
    return true;
  }

  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  if (!hmacSecret) {
    console.error('[Paymob HMAC] PAYMOB_HMAC_SECRET is missing from environment variables.');
    return false;
  }

  if (!obj || !receivedHmac) {
    return false;
  }

  // Exact lexicographical order defined in Paymob official documentation:
  const concatenatedValues =
    (obj.amount_cents ?? '') +
    (obj.created_at ?? '') +
    (obj.currency ?? '') +
    (obj.error_occured ?? '') +
    (obj.has_parent_transaction ?? '') +
    (obj.id ?? '') +
    (obj.integration_id ?? '') +
    (obj.is_3d_secure ?? '') +
    (obj.is_auth ?? '') +
    (obj.is_capture ?? '') +
    (obj.is_refunded ?? '') +
    (obj.is_standalone_payment ?? '') +
    (obj.is_voided ?? '') +
    (obj.order?.id ?? '') +
    (obj.owner ?? '') +
    (obj.pending ?? '') +
    (obj.source_data?.pan ?? '') +
    (obj.source_data?.sub_type ?? '') +
    (obj.source_data?.type ?? '') +
    (obj.success ?? '');

  const computedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenatedValues)
    .digest('hex');

  // Use timingSafeEqual to protect against timing attacks
  const computedBuffer = Buffer.from(computedHmac, 'utf8');
  const receivedBuffer = Buffer.from(receivedHmac, 'utf8');

  if (computedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, receivedBuffer);
}

/**
 * Direct Card Payment Processing (Seamless Paymob Financial Rail)
 * Submits card credentials to Paymob's payment processor directly.
 * If 3D Secure is required, returns the bank's ACS redirection URL.
 * 
 * @param {Object} params
 * @param {string} params.paymentToken - Payment token from generatePaymentKey
 * @param {Object} params.cardData - { number, holderName, expiryMonth, expiryYear, cvv }
 * @param {Object} params.billingData - Customer billing details
 * @returns {Promise<Object>} The Paymob payment result or redirection details
 */
async function processDirectCardPayment({ paymentToken, cardData, billingData = {} }) {
  if (isSimulationMode()) {
    return {
      success: true,
      isSimulation: true,
      pending: false,
      requires3ds: false,
    };
  }

  let expiryMonth = cardData.expiryMonth.toString().padStart(2, '0');
  let expiryYear = cardData.expiryYear.toString().trim();
  if (expiryYear.length === 4) {
    expiryYear = expiryYear.slice(-2);
  }

  const cleanCardNumber = cardData.number.replace(/\s+/g, '');

  const payload = {
    source: {
      identifier: cleanCardNumber,
      sourceholder_name: cardData.holderName || 'Artisan Patron',
      subtype: 'CARD',
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      cvn: cardData.cvv,
    },
    billing: {
      apartment: billingData.apartment || 'NA',
      building: billingData.building || 'NA',
      city: billingData.city || 'Cairo',
      country: billingData.country || 'EG',
      email: billingData.email || 'customer@example.com',
      first_name: (cardData.holderName || 'Patron').trim().split(' ')[0] || 'Patron',
      floor: billingData.floor || 'NA',
      last_name: (cardData.holderName || 'Patron').trim().split(' ').slice(1).join(' ') || 'Patron',
      phone_number: billingData.phone || '+201000000000',
      postal_code: billingData.postalCode || 'NA',
      state: billingData.state || 'NA',
      street: billingData.street || 'NA',
    },
    payment_token: paymentToken,
    api_source: 'IFRAME',
  };

  const response = await fetch(`${PAYMOB_BASE_URL}/acceptance/payments/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data['data.message'] || data.message || `Payment processing error (${response.status})`;
    throw new Error(errorMsg);
  }

  const hasRedirection = Boolean(data.use_redirection && data.redirection_url);

  return {
    success: data.success === 'true' || data.success === true,
    pending: data.pending === 'true' || data.pending === true,
    requires3ds: hasRedirection,
    redirectionUrl: data.redirection_url || null,
    transactionId: data.id,
    orderId: data.order,
    message: data['data.message'] || 'Payment processed',
    raw: data,
  };
}

/**
 * Active Transaction Inquiry: Checks the actual live payment status of an order directly with Paymob.
 * @param {string|number} paymobOrderId - Paymob's numerical order ID
 * @returns {Promise<Object>} Status inquiry result
 */
async function inquirePaymobOrder(paymobOrderId) {
  if (isSimulationMode() || !paymobOrderId) {
    return { success: false, isPaid: false };
  }

  try {
    const authToken = await getAuthToken();
    const response = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders/transaction_inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        order_id: paymobOrderId.toString(),
      }),
    });

    if (!response.ok) {
      return { success: false, isPaid: false };
    }

    const data = await response.json().catch(() => ({}));
    const isPaid =
      (data.success === true || data.success === 'true') &&
      (data.order?.payment_status === 'PAID' ||
        data.data?.txn_response_code === 'APPROVED' ||
        data.data?.message === 'Approved');

    return {
      success: true,
      isPaid,
      transactionId: data.id,
      amountCents: data.amount_cents,
      raw: data,
    };
  } catch (err) {
    console.warn('[Paymob Inquiry Error]:', err.message);
    return { success: false, isPaid: false };
  }
}

module.exports = {
  getAuthToken,
  registerPaymobOrder,
  generatePaymentKey,
  createCardPaymentSession,
  processDirectCardPayment,
  inquirePaymobOrder,
  verifyHmacSignature,
  isSimulationMode,
};
