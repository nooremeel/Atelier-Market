const request = require('supertest');
const app = require('../../app');
const Product = require('../../models/product');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function login(agent, email = 'a@b.com') {
  const password = 'Passw0rd!x';
  const user = await User.create({ email, password: await bcrypt.hash(password, 4), cart: { items: [] } });
  const { body } = await agent.get('/api/csrf-token');
  await agent.post('/api/auth/login').set('csrf-token', body.csrfToken).send({ email, password });
  return user;
}

describe('cart API', () => {
  it('401 when logged out', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('adds, lists, decrements, deletes', async () => {
    const agent = request.agent(app);
    await login(agent);
    const p = await Product.create({
      title: 'Oud', price: 25, description: 'Deep resin scent', imageUrl: 'images/oud.jpg',
      userId: new mongoose.Types.ObjectId(),
    });
    const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;

    let res = await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBe(1);

    await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });
    res = await agent.get('/api/cart');
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.totalPrice).toBe(50);

    res = await agent.post('/api/cart/decrement').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.body.items[0].quantity).toBe(1);

    res = await agent.post('/api/cart/delete').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.body.items).toHaveLength(0);
  });
});
