const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const buildServer = require('../server/server');
const { matches } = require('../server/fixtures/matches');
const { clearPredictions } = require('../server/predictions/store');

let server;
let baseUrl;

async function startServer() {
  const app = buildServer();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
}

beforeEach(async () => {
  clearPredictions();
  await startServer();
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = undefined;
  }
});

async function login() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demo', password: 'password123' })
  });
  assert.equal(response.status, 200, 'Login should succeed');
  const payload = await response.json();
  return payload.token;
}

test('allows submitting a prediction for an upcoming match', async () => {
  const token = await login();
  const match = matches.find((item) => new Date(item.kickoff) > new Date());
  assert.ok(match, 'Expected at least one upcoming match');

  const players = match.players.slice(0, 11).map((player) => player.id);

  const createResponse = await fetch(`${baseUrl}/api/matches/${match.id}/prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ players, formation: '4-3-3' })
  });

  assert.equal(createResponse.status, 201);
  const createPayload = await createResponse.json();
  assert.equal(createPayload.prediction.players.length, 11);

  const getResponse = await fetch(`${baseUrl}/api/matches/${match.id}/prediction`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  assert.equal(getResponse.status, 200);
  const getPayload = await getResponse.json();
  assert.equal(getPayload.prediction.formation, '4-3-3');
});

test('rejects duplicate player selections', async () => {
  const token = await login();
  const match = matches.find((item) => new Date(item.kickoff) > new Date());
  assert.ok(match, 'Expected upcoming match');

  const players = new Array(11).fill(match.players[0].id);

  const response = await fetch(`${baseUrl}/api/matches/${match.id}/prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ players })
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.message, /Duplicate players/);
});

test('locks matches after kickoff', async () => {
  const token = await login();
  const lockedMatch = matches.find((item) => new Date(item.kickoff) <= new Date());
  assert.ok(lockedMatch, 'Expected locked match');

  const players = lockedMatch.players.slice(0, 11).map((player) => player.id);

  const response = await fetch(`${baseUrl}/api/matches/${lockedMatch.id}/prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ players })
  });

  assert.equal(response.status, 423);
  const payload = await response.json();
  assert.match(payload.message, /locked/);
});
