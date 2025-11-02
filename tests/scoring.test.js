const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createScoringEngine, defaultRules } = require('../server/scoring/engine');

test('awards points for matched players based on rules', () => {
  const engine = createScoringEngine();
  const prediction = {
    players: ['p1', 'p2', 'p3', 'p4'],
    formation: '4-3-3'
  };
  const lineup = {
    players: ['p2', 'p4', 'p5', 'p6'],
    formation: '4-2-3-1'
  };

  const result = engine.score(prediction, lineup);
  assert.equal(result.points, 2 * defaultRules.playerMatchPoints);
  assert.deepEqual(result.breakdown.matchedPlayers.sort(), ['p2', 'p4']);
  assert.equal(result.breakdown.bonus, 0);
});

test('adds formation bonus when prediction matches official formation', () => {
  const engine = createScoringEngine({ formationMatchPoints: 7 });
  const prediction = {
    players: ['p1', 'p2', 'p3'],
    formation: '4-4-2'
  };
  const lineup = {
    players: ['p1', 'p2', 'p4'],
    formation: '4-4-2'
  };

  const result = engine.score(prediction, lineup);
  const expected = 2 * defaultRules.playerMatchPoints + 7;
  assert.equal(result.points, expected);
  assert.equal(result.breakdown.bonus, 7);
});

test('grants full lineup bonus when all players match', () => {
  const engine = createScoringEngine({ fullLineupBonus: 25 });
  const prediction = {
    players: ['p1', 'p2', 'p3'],
    formation: '3-4-3'
  };
  const lineup = {
    players: ['p3', 'p2', 'p1'],
    formation: '3-4-3'
  };

  const result = engine.score(prediction, lineup);
  const expected = 3 * defaultRules.playerMatchPoints + 25 + defaultRules.formationMatchPoints;
  assert.equal(result.points, expected);
  assert.equal(result.breakdown.bonus, 25 + defaultRules.formationMatchPoints);
});

test('ignores duplicate players when scoring', () => {
  const engine = createScoringEngine();
  const prediction = {
    players: ['p1', 'p1', 'p2'],
    formation: '4-3-3'
  };
  const lineup = {
    players: ['p1', 'p2', 'p3'],
    formation: '4-3-3'
  };

  const result = engine.score(prediction, lineup);
  const expected = 2 * defaultRules.playerMatchPoints + defaultRules.formationMatchPoints;
  assert.equal(result.points, expected);
  assert.deepEqual(result.breakdown.matchedPlayers.sort(), ['p1', 'p2']);
});
