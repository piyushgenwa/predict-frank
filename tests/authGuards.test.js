const test = require('node:test');
const assert = require('node:assert/strict');
const { requireAuth, requireAdmin } = require('../server/auth/guards');
const { signToken } = require('../server/auth/jwt');

function createResRecorder() {
  const state = { statusCode: 200, payload: null };
  return {
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(payload) {
      state.payload = payload;
      return this;
    },
    getState() {
      return state;
    }
  };
}

test('requireAuth blocks unauthenticated requests', async () => {
  const handler = requireAuth(async () => {
    throw new Error('Handler should not be called');
  });
  const res = createResRecorder();
  await handler({ headers: {} }, res);
  const { statusCode, payload } = res.getState();
  assert.equal(statusCode, 401);
  assert.match(payload.message, /Authentication required/);
});

test('requireAdmin blocks non-admin users', async () => {
  const token = signToken({ sub: 'user-1', username: 'demo', isAdmin: false });
  let called = false;
  const handler = requireAdmin(async () => {
    called = true;
  });
  const res = createResRecorder();
  await handler({ headers: { Authorization: `Bearer ${token}` } }, res);
  const { statusCode, payload } = res.getState();
  assert.equal(called, false, 'Handler should not run');
  assert.equal(statusCode, 403);
  assert.match(payload.message, /Admin/);
});

test('requireAdmin allows admin users', async () => {
  const token = signToken({ sub: 'user-2', username: 'analyst', isAdmin: true });
  let called = false;
  const handler = requireAdmin(async (_req, _res, user) => {
    called = user.isAdmin;
  });
  const res = createResRecorder();
  await handler({ headers: { Authorization: `Bearer ${token}` } }, res);
  assert.equal(called, true);
});
