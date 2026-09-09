const request = require('supertest');
const path = require('path');
const app = require('../../app');
const User = require('../../models/user');
const Product = require('../../models/product');
const bcrypt = require('bcryptjs');

async function adminAgent(email = 'admin@shop.com') {
  const agent = request.agent(app);
  const password = 'Passw0rd!x';
  const user = await User.create({ email, password: await bcrypt.hash(password, 4), cart: { items: [] } });
  const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  await agent.post('/api/auth/login').set('csrf-token', csrf).send({ email, password });
  return { agent, csrf, user };
}

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'pixel.png');

describe('admin products API', () => {
  it('401 when logged out', async () => {
    expect((await request(app).get('/api/admin/products')).status).toBe(401);
  });

  it('creates, lists, reads, updates, deletes an owned product', async () => {
    const { agent, csrf } = await adminAgent();

    let res = await agent.post('/api/admin/products')
      .set('csrf-token', csrf)
      .field('title', 'Amber Mist')
      .field('price', '42.50')
      .field('description', 'A warm amber fragrance')
      .attach('image', FIXTURE);
    expect(res.status).toBe(201);
    const id = res.body.product._id;

    res = await agent.get('/api/admin/products');
    expect(res.body.products).toHaveLength(1);

    res = await agent.put(`/api/admin/products/${id}`)
      .set('csrf-token', csrf)
      .field('title', 'Amber Mist II')
      .field('price', '45')
      .field('description', 'A warmer amber fragrance');
    expect(res.status).toBe(200);
    expect(res.body.product.title).toBe('Amber Mist II');

    res = await agent.delete(`/api/admin/products/${id}`).set('csrf-token', csrf);
    expect(res.status).toBe(200);
  });

  it('422 on missing image at create', async () => {
    const { agent, csrf } = await adminAgent('a2@shop.com');
    const res = await agent.post('/api/admin/products')
      .set('csrf-token', csrf)
      .field('title', 'No Image')
      .field('price', '10')
      .field('description', 'Missing the file');
    expect(res.status).toBe(422);
  });
});
