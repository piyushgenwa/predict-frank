const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const buildServer = require('../server/server');
const { matches } = require('../server/fixtures/matches');
const { clearPredictions } = require('../server/predictions/store');
const { clearOfficialLineups } = require('../server/matches/officialLineups');
const { clearScores } = require('../server/scoring/store');
const { waitForScoring } = require('../server/scoring/scheduler');

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
  clearOfficialLineups();
  clearScores();
  await startServer();
});

afterEach(async () => {
  await waitForScoring();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = undefined;
  }
});

async function login({ username = 'demo', password = 'password123' } = {}) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
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

test('prevents non-admins from managing official lineups', async () => {
  const token = await login();
  const match = matches.find((item) => new Date(item.kickoff) > new Date());
  assert.ok(match, 'Expected upcoming match');

  const players = match.players.slice(0, 11).map((player) => player.id);

  const response = await fetch(`${baseUrl}/api/matches/${match.id}/official-lineup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ players })
  });

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.match(payload.message, /Admin/);
});

test('requires exactly 11 players for official lineup', async () => {
  const adminToken = await login({ username: 'analyst', password: 'matchday' });
  const match = matches.find((item) => new Date(item.kickoff) > new Date());
  assert.ok(match, 'Expected upcoming match');

  const response = await fetch(`${baseUrl}/api/matches/${match.id}/official-lineup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ players: match.players.slice(0, 10).map((player) => player.id) })
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.message, /exactly 11/);
});

test('allows admins to submit and retrieve official lineups', async () => {
  const adminToken = await login({ username: 'analyst', password: 'matchday' });
  const match = matches.find((item) => new Date(item.kickoff) > new Date());
  assert.ok(match, 'Expected upcoming match');

  const players = match.players.slice(0, 11).map((player) => player.id);

  const createResponse = await fetch(`${baseUrl}/api/matches/${match.id}/official-lineup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ players })
  });

  assert.equal(createResponse.status, 201);
  const createPayload = await createResponse.json();
  assert.equal(createPayload.lineup.players.length, 11);
  assert.equal(createPayload.lineup.submittedBy, 'user-2');
  assert.ok(Date.parse(createPayload.lineup.submittedAt));

  const getResponse = await fetch(`${baseUrl}/api/matches/${match.id}/official-lineup`, {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(getResponse.status, 200);
  const getPayload = await getResponse.json();
  assert.deepEqual(getPayload.lineup.players, players);
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
