const lineups = new Map();

function getOfficialLineup(matchId) {
  return lineups.get(matchId) || null;
}

function saveOfficialLineup(lineup) {
  lineups.set(lineup.matchId, lineup);
  return lineup;
}

function clearOfficialLineups() {
  lineups.clear();
}

module.exports = {
  getOfficialLineup,
  saveOfficialLineup,
  clearOfficialLineups
};
