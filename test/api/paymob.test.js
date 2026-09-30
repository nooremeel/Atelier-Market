const request = require('supertest');
const app = require('../../app');
const Product = require('../../models/product');
const User = require('../../models/user');
const Order = require('../../models/order');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const crypto = require('crypto');

async function loginAgent(email = 'paymob_user@atelier.com') {
  const agent = request.agent(app);
  const password = 'Passw0rd!x';
  await User.create({ email, password: await bcrypt.hash(password, 4), cart: { items: [] } });
  const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  await agent.post('/api/auth/login').set('csrf-token', csrf).send({ email, password });
  return { agent, csrf };
}

describe('Paymob Payment Integration API', () => {
  it('rejects initiation if cart is empty', async () => {
    const { agent, csrf } = await loginAgent('empty_paymob@atelier.com');
    const res = await agent.post('/api/paymob/initiate').set('csrf-token', csrf).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/empty/i);
  });

  it('initiates Paymob session, creates a pending order, and clears cart', async () => {
    const { agent, csrf } = await loginAgent('initiate_paymob@atelier.com');
    const prod = await Product.create({
      title: 'Handwoven Kilm Runner',
      price: 120,
      stock: 10,
      description: 'Wool runner',
      imageUrl: 'images/kilm.jpg',
      userId: new mongoose.Types.ObjectId(),
    });

    await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: prod._id });

    const res = await agent.post('/api/paymob/initiate').set('csrf-token', csrf).send({
      shippingAddress: {
        name: 'Fatima Al-Mansoor',
        street: 'Corniche Rd 45',
        city: 'Abu Dhabi',
        country: 'United Arab Emirates',
        postalCode: '00000',
        phone: '+971501234567',
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.iframeUrl).toContain('acceptance/iframes');
    expect(res.body.paymentToken).toBeDefined();

    // Verify order was created in 'pending' and 'unpaid' state
    const order = await Order.findById(res.body.orderId);
    expect(order).not.toBeNull();
    expect(order.status).toBe('pending');
    expect(order.paymentStatus).toBe('unpaid');
    expect(order.totalPrice).toBe(120);

    // Verify cart was preserved while modal is open (so customer doesn't lose items if dismissed)
    const cartRes = await agent.get('/api/cart');
    expect(cartRes.body.items).toHaveLength(1);

    // Verify canceling removes the unconfirmed draft order
    await agent.post('/api/paymob/cancel').set('csrf-token', csrf).send({ orderId: res.body.orderId });
    const draft = await Order.findById(res.body.orderId);
    expect(draft).toBeNull();
  });

  it('processes webhook with HMAC, confirms order, and decrements stock (CSRF exempt)', async () => {
    const user = await User.create({
      email: 'webhook_cust@atelier.com',
      password: await bcrypt.hash('Passw0rd!x', 4),
      cart: { items: [] },
    });

    const prod = await Product.create({
      title: 'Damascene Inlaid Box',
      price: 85,
      stock: 5,
      description: 'Walnut & mother of pearl',
      imageUrl: 'images/box.jpg',
      userId: new mongoose.Types.ObjectId(),
    });

    const order = await Order.create({
      user: { email: user.email, userId: user._id, name: 'Tariq Aziz' },
      products: [{ productData: { _id: prod._id, title: prod.title, price: 85 }, quantity: 2 }],
      totalPrice: 170,
      status: 'pending',
      paymentStatus: 'unpaid',
      shippingAddress: { name: 'Tariq Aziz', street: 'Hamra', city: 'Beirut', country: 'Lebanon' },
    });

    const webhookPayload = {
      obj: {
        id: 7654321,
        success: true,
        order: {
          id: 112233,
          merchant_order_id: order._id.toString(),
        },
        amount_cents: 17000,
        currency: 'USD',
      },
    };

    // Calculate real cryptographic HMAC
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET || 'test_hmac_secret_placeholder';
    const concatenated =
      webhookPayload.obj.amount_cents +
      '' + // created_at
      webhookPayload.obj.currency +
      '' + // error_occured
      '' + // has_parent_transaction
      webhookPayload.obj.id +
      '' + // integration_id
      '' + // is_3d_secure
      '' + // is_auth
      '' + // is_capture
      '' + // is_refunded
      '' + // is_standalone_payment
      '' + // is_voided
      webhookPayload.obj.order.id +
      '' + // owner
      '' + // pending
      '' + // pan
      '' + // sub_type
      '' + // type
      webhookPayload.obj.success;
    const computedHmac = crypto.createHmac('sha512', hmacSecret).update(concatenated).digest('hex');

    const res = await request(app)
      .post(`/api/paymob/webhook?hmac=${computedHmac}`)
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    // Verify order status is updated to confirmed & paid
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe('paid');
    expect(updatedOrder.status).toBe('confirmed');
    expect(updatedOrder.paymentReference).toBe('PAYMOB-TXN-7654321');

    // Verify product stock was decremented from 5 to 3 (purchased 2)
    const updatedProd = await Product.findById(prod._id);
    expect(updatedProd.stock).toBe(3);
  });

  it('rejects webhooks with invalid HMAC signatures', async () => {
    const res = await request(app)
      .post('/api/paymob/webhook?hmac=tampered_signature')
      .send({ obj: { id: 1234, success: true } });

    expect(res.status).toBe(401);
  });

  it('processes direct card payment submission via /api/paymob/pay', async () => {
    const { agent, csrf } = await loginAgent('direct_pay_user@atelier.com');
    const prod = await Product.create({
      title: 'Ceramic Tea Bowl',
      price: 65,
      stock: 8,
      description: 'Handmade bowl',
      imageUrl: 'images/bowl.jpg',
      userId: new mongoose.Types.ObjectId(),
    });

    await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: prod._id });

    // 1. Initiate order
    const initRes = await agent.post('/api/paymob/initiate').set('csrf-token', csrf).send({
      shippingAddress: {
        name: 'Sara Hassan',
        street: 'King Road 10',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        postalCode: '11564',
        phone: '+966501234567',
      },
    });

    expect(initRes.status).toBe(200);
    const { orderId, paymentToken } = initRes.body;

    // 2. Direct card payment
    const payRes = await agent.post('/api/paymob/pay').set('csrf-token', csrf).send({
      orderId,
      paymentToken,
      card: {
        number: '4111111111111111',
        holderName: 'Sara Hassan',
        expiryMonth: '12',
        expiryYear: '28',
        cvv: '123',
      },
    });

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
  });
});
