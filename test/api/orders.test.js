const request = require('supertest');
const app = require('../../app');
const Product = require('../../models/product');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function loginAgent(email = 'o@b.com') {
  const agent = request.agent(app);
  const password = 'Passw0rd!x';
  await User.create({ email, password: await bcrypt.hash(password, 4), cart: { items: [] } });
  const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  await agent.post('/api/auth/login').set('csrf-token', csrf).send({ email, password });
  return { agent, csrf };
}

describe('orders API', () => {
  it('rejects an order with an empty cart', async () => {
    const { agent, csrf } = await loginAgent();
    const res = await agent.post('/api/orders').set('csrf-token', csrf).send({});
    expect(res.status).toBe(400);
  });

  it('places an order, clears the cart, lists it, streams a PDF', async () => {
    const { agent, csrf } = await loginAgent('o2@b.com');
    const p = await Product.create({
      title: 'Zaatar', price: 8, description: 'Wild thyme blend', imageUrl: 'images/z.jpg',
      userId: new mongoose.Types.ObjectId(),
    });
    await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });

    let res = await agent.post('/api/orders').set('csrf-token', csrf).send({});
    expect(res.status).toBe(201);
    expect(res.body.order.totalPrice).toBe(8);

    res = await agent.get('/api/cart');
    expect(res.body.items).toHaveLength(0);

    res = await agent.get('/api/orders');
    expect(res.body.orders).toHaveLength(1);
    const orderId = res.body.orders[0]._id;

    res = await agent.get(`/api/orders/${orderId}/invoice`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
  });
});
