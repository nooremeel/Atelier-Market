const request = require('supertest');
const app = require('../../app');
const Product = require('../../models/product');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function login(agent, email = 'a@b.com', role = 'customer') {
  const password = 'Passw0rd!x';
  const user = await User.create({ email, password: await bcrypt.hash(password, 4), role, cart: { items: [] } });
  const { body } = await agent.get('/api/csrf-token');
  await agent.post('/api/auth/login').set('csrf-token', body.csrfToken).send({ email, password });
  return user;
}

describe('cart API', () => {
  it('401 when logged out', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('403 when logged in as seller', async () => {
    const agent = request.agent(app);
    await login(agent, 'seller@shop.com', 'seller');
    const res = await agent.get('/api/cart');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
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

  it('rejects adding to cart when product is sold out', async () => {
    const agent = request.agent(app);
    await login(agent, 'soldout@test.com');
    const p = await Product.create({
      title: 'Sold Out Vase', price: 100, description: 'Exclusive piece', imageUrl: 'images/vase.jpg',
      userId: new mongoose.Types.ObjectId(),
      stock: 0,
    });
    const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;

    const res = await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sold out/i);
  });

  it('rejects adding to cart when quantity exceeds available stock', async () => {
    const agent = request.agent(app);
    await login(agent, 'stocklimit@test.com');
    const p = await Product.create({
      title: 'Limited Vessel', price: 120, description: 'Only one made', imageUrl: 'images/vessel.jpg',
      userId: new mongoose.Types.ObjectId(),
      stock: 1,
    });
    const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;

    let res = await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.status).toBe(200);

    // Second add attempt should exceed stock limit of 1
    res = await agent.post('/api/cart').set('csrf-token', csrf).send({ productId: p._id });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only 1 pieces available/i);
  });

  it('supports distinct variants of the same product with distinct prices', async () => {
    const agent = request.agent(app);
    await login(agent, 'variants@test.com');
    const p = await Product.create({
      title: 'Bespoke Vessel',
      price: 100,
      description: 'Handmade ceramic vessel',
      imageUrl: 'images/vessel.jpg',
      userId: new mongoose.Types.ObjectId(),
      stock: 20,
      variants: [
        { name: 'Small (250ml)', sku: 'VES-S', price: 90, stock: 5 },
        { name: 'Large (500ml)', sku: 'VES-L', price: 140, stock: 2 },
      ],
    });
    const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
    const smallVar = p.variants[0];
    const largeVar = p.variants[1];

    // Add Small variant
    let res = await agent.post('/api/cart').set('csrf-token', csrf).send({
      productId: p._id,
      variantId: smallVar._id,
      quantity: 1,
    });
    expect(res.status).toBe(200);

    // Add Large variant of same product
    res = await agent.post('/api/cart').set('csrf-token', csrf).send({
      productId: p._id,
      variantId: largeVar._id,
      quantity: 1,
    });
    expect(res.status).toBe(200);

    // Cart should contain 2 distinct lines with variant-specific unit prices
    res = await agent.get('/api/cart');
    expect(res.body.items).toHaveLength(2);
    expect(res.body.totalItems).toBe(2);
    expect(res.body.totalPrice).toBe(230); // 90 + 140

    const smallLine = res.body.items.find((i) => i.variantId === smallVar._id.toString());
    const largeLine = res.body.items.find((i) => i.variantId === largeVar._id.toString());
    expect(smallLine.variant.name).toBe('Small (250ml)');
    expect(smallLine.unitPrice).toBe(90);
    expect(largeLine.variant.name).toBe('Large (500ml)');
    expect(largeLine.unitPrice).toBe(140);

    // Delete small variant only
    res = await agent.post('/api/cart/delete').set('csrf-token', csrf).send({
      productId: p._id,
      variantId: smallVar._id,
    });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].variantId).toBe(largeVar._id.toString());
    expect(res.body.totalPrice).toBe(140);
  });
});

