const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Product = require('../../models/product');

const userId = new mongoose.Types.ObjectId();

async function seed(n = 6) {
  const docs = [];
  for (let i = 1; i <= n; i++) {
    docs.push({
      title: i % 2 ? `Arabica Coffee ${i}` : `Green Tea ${i}`,
      price: i * 10,
      description: `Description for item ${i} with keyword special${i}`,
      imageUrl: `images/item-${i}.jpg`,
      userId,
    });
  }
  await Product.insertMany(docs);
}

describe('GET /api/products', () => {
  it('paginates with 4 per page', async () => {
    await seed(6);
    const res = await request(app).get('/api/products?page=1');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(4);
    expect(res.body.pagination).toMatchObject({
      currentPage: 1, lastPage: 2, hasNextPage: true, hasPreviousPage: false, totalItems: 6,
    });
  });

  it('filters by q against title and description', async () => {
    await seed(6);
    const res = await request(app).get('/api/products?q=special3');
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].description).toContain('special3');
  });

  it('sorts by price_desc', async () => {
    await seed(4);
    const res = await request(app).get('/api/products?sort=price_desc');
    const prices = res.body.products.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('bounds by minPrice/maxPrice', async () => {
    await seed(6);
    const res = await request(app).get('/api/products?minPrice=20&maxPrice=40');
    expect(res.body.products.every((p) => p.price >= 20 && p.price <= 40)).toBe(true);
  });
});

describe('GET /api/products/:id', () => {
  it('returns one product', async () => {
    await seed(1);
    const one = await Product.findOne();
    const res = await request(app).get(`/api/products/${one._id}`);
    expect(res.status).toBe(200);
    expect(res.body.product._id).toBe(one._id.toString());
  });

  it('404s for a missing id', async () => {
    const res = await request(app).get(`/api/products/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });
});
