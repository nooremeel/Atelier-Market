const request = require('supertest');
const app = require('../../app');

describe('app boot', () => {
  it('serves an unknown API route as JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
    expect(res.body).toHaveProperty('message');
  });

  it('has no EJS view engine configured', () => {
    expect(app.get('view engine')).toBeUndefined();
  });
});
