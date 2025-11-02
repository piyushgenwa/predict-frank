const test = require('node:test');
const assert = require('node:assert/strict');
const { matches } = require('../server/fixtures/matches');
const {
  hasDuplicatePlayers,
  validatePlayerSelection,
  isMatchLocked,
  validatePlayersBelongToMatch
} = require('../server/utils/predictionValidation');

const sampleMatch = matches[0];

test('detects duplicate players', () => {
  assert.equal(hasDuplicatePlayers(['p1', 'p1']), true);
  assert.equal(hasDuplicatePlayers(['p1', 'p2']), false);
});

test('prevents more than 11 players', () => {
  const players = Array.from({ length: 12 }, (_, index) => `p${index}`);
  const validation = validatePlayerSelection(players);
  assert.equal(validation.valid, false);
  assert.match(validation.reason, /11/);
});

test('blocks locked matches', () => {
  const lockedMatch = matches.find((match) => new Date(match.kickoff) < new Date());
  assert.ok(lockedMatch, 'Expected at least one locked match');
  assert.equal(isMatchLocked(lockedMatch), true);
});

test('allows only players from the roster', () => {
  assert.equal(validatePlayersBelongToMatch(sampleMatch, ['invalid']), false);
  assert.equal(
    validatePlayersBelongToMatch(sampleMatch, [sampleMatch.players[0].id]),
    true
  );
});
