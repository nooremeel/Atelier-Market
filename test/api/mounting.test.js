const request = require('supertest');
const app = require('../../app');

describe('route mounting', () => {
  it('serves products only under /api', async () => {
    const apiRes = await request(app).get('/api/products');
    expect(apiRes.status).toBe(200);
    expect(Array.isArray(apiRes.body.products)).toBe(true);

    const legacyRes = await request(app).get('/product-list');
    expect([200, 503]).toContain(legacyRes.status); // falls through to SPA catch-all
    expect(legacyRes.body.products).toBeUndefined();  // NOT the products handler
  });

  it('non-api unknown path falls through to the SPA handler (503 before build)', async () => {
    const res = await request(app).get('/some/spa/route');
    expect([200, 503]).toContain(res.status);
  });

  it('unknown /api path is JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
  });
});
