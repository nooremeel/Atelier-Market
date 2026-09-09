const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user');

function agent() { return request.agent(app); }
async function csrfFor(a) { return (await a.get('/api/csrf-token')).body.csrfToken; }

describe('auth API', () => {
  it('signs up, logs in, sees me, logs out', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const creds = { email: 'new@user.com', password: 'Str0ng!pass', confirmPassword: 'Str0ng!pass' };

    let res = await a.post('/api/auth/signup').set('csrf-token', csrf).send(creds);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@user.com');

    res = await a.post('/api/auth/login').set('csrf-token', csrf).send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(200);

    res = await a.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('new@user.com');

    res = await a.post('/api/auth/logout').set('csrf-token', csrf).send({});
    expect(res.status).toBe(200);
    res = await a.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a weak signup password with 422 + validationErrors', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const res = await a.post('/api/auth/signup').set('csrf-token', csrf)
      .send({ email: 'x@y.com', password: 'weak', confirmPassword: 'weak' });
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.validationErrors)).toBe(true);
    expect(res.body.errorMessage).toBeTruthy();
  });

  it('rejects bad login with 422', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const res = await a.post('/api/auth/login').set('csrf-token', csrf)
      .send({ email: 'ghost@user.com', password: 'whatever12' });
    expect(res.status).toBe(422);
  });

  it('reset-password returns ok even for unknown email', async () => {
    const a = agent();
    const csrf = await csrfFor(a);
    const res = await a.post('/api/auth/reset-password').set('csrf-token', csrf).send({ email: 'nobody@x.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
