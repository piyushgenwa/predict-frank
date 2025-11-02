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

async function login({ username, password }) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  assert.equal(response.status, 200, 'Login should succeed');
  const payload = await response.json();
  return payload.token;
}

test('leaderboard ranks users by cumulative points', async () => {
  const demoToken = await login({ username: 'demo', password: 'password123' });
  const adminToken = await login({ username: 'analyst', password: 'matchday' });

  const match = matches[0];
  const officialPlayers = match.players.slice(0, 11).map((player) => player.id);

  // Demo predicts the exact lineup
  let response = await fetch(`${baseUrl}/api/matches/${match.id}/prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ players: officialPlayers, formation: '4-3-3' })
  });
  assert.equal(response.status, 201, 'Demo prediction should be created');

  // Analyst participates with a different prediction
  const analystPlayers = [
    ...officialPlayers.slice(0, 6),
    ...match.players.slice(11, 16).map((player) => player.id)
  ];
  response = await fetch(`${baseUrl}/api/matches/${match.id}/prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ players: analystPlayers, formation: '3-5-2' })
  });
  assert.equal(response.status, 201, 'Analyst prediction should be created');

  // Official lineup is submitted by the analyst
  response = await fetch(`${baseUrl}/api/matches/${match.id}/official-lineup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ players: officialPlayers, formation: '4-3-3' })
  });
  assert.equal(response.status, 201, 'Official lineup submission should succeed');

  await waitForScoring();

  const leaderboardRes = await fetch(`${baseUrl}/api/leaderboard`);
  assert.equal(leaderboardRes.status, 200);
  const leaderboardPayload = await leaderboardRes.json();
  assert.ok(Array.isArray(leaderboardPayload.leaderboard));
  assert.equal(leaderboardPayload.leaderboard.length, 2);
  assert.equal(leaderboardPayload.leaderboard[0].userId, 'user-1');
  assert.equal(leaderboardPayload.leaderboard[0].rank, 1);
  assert.equal(leaderboardPayload.leaderboard[1].userId, 'user-2');

  const demoTotal = leaderboardPayload.leaderboard[0].totalPoints;
  const analystTotal = leaderboardPayload.leaderboard[1].totalPoints;
  assert.ok(demoTotal > analystTotal, 'Demo should have more points');
  assert.ok(
    leaderboardPayload.leaderboard[0].recentMatches.length > 0,
    'Leaderboard should include recent matches'
  );

  const historyRes = await fetch(`${baseUrl}/api/users/user-1/history`);
  assert.equal(historyRes.status, 200);
  const historyPayload = await historyRes.json();
  assert.equal(historyPayload.history.length, 1);
  assert.equal(historyPayload.history[0].matchId, match.id);
  assert.equal(historyPayload.history[0].points, demoTotal);
});
