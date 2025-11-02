const MAX_PLAYERS = 11;

function hasDuplicatePlayers(players) {
  const seen = new Set();
  for (const player of players) {
    if (seen.has(player)) {
      return true;
    }
    seen.add(player);
  }
  return false;
}

function validatePlayerSelection(players) {
  if (!Array.isArray(players) || players.length === 0) {
    return { valid: false, reason: 'At least one player must be selected.' };
  }

  if (players.length > MAX_PLAYERS) {
    return { valid: false, reason: `You can only pick ${MAX_PLAYERS} players.` };
  }

  if (hasDuplicatePlayers(players)) {
    return { valid: false, reason: 'Duplicate players are not allowed.' };
  }

  return { valid: true };
}

function isMatchLocked(match, date = new Date()) {
  return date >= new Date(match.kickoff);
}

function validatePlayersBelongToMatch(match, players) {
  const roster = new Set(match.players.map((player) => player.id));
  return players.every((playerId) => roster.has(playerId));
}

module.exports = {
  MAX_PLAYERS,
  hasDuplicatePlayers,
  validatePlayerSelection,
  isMatchLocked,
  validatePlayersBelongToMatch
};
