const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../app');

describe('SPA static serving', () => {
  const dir = path.join(__dirname, '..', '..', 'public', 'app');
  const index = path.join(dir, 'index.html');
  let created = false;

  beforeAll(() => {
    if (!fs.existsSync(index)) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(index, '<!doctype html><title>Shop</title><div id="root"></div>');
      created = true;
    }
  });
  afterAll(() => { if (created) fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns index.html for a client route', async () => {
    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="root"');
  });

  it('still serves JSON 404 for unknown /api routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
  });
});
