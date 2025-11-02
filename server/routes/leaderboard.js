const { getLeaderboard, getUserHistory } = require('../scoring/store');
const { findMatchById } = require('../fixtures/matches');
const { findUserById } = require('../fixtures/users');

function toHistoryItem(record) {
  const match = findMatchById(record.matchId);
  return {
    matchId: record.matchId,
    points: record.points,
    calculatedAt: record.calculatedAt,
    homeTeam: match ? match.homeTeam : null,
    awayTeam: match ? match.awayTeam : null,
    kickoff: match ? match.kickoff : null
  };
}

function registerLeaderboardRoutes(app) {
  app.get('/api/leaderboard', (_req, res) => {
    const leaderboard = getLeaderboard().map((entry, index) => {
      const user = findUserById(entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        displayName: user ? user.displayName : entry.userId,
        totalPoints: entry.totalPoints,
        matchCount: entry.matchCount,
        lastUpdatedAt: entry.lastUpdatedAt,
        recentMatches: getUserHistory(entry.userId)
          .slice(0, 5)
          .map(toHistoryItem)
      };
    });

    res.json({ leaderboard });
  });

  app.get('/api/users/:id/history', (req, res) => {
    const history = getUserHistory(req.params.id).map(toHistoryItem);
    res.json({ history });
  });
}

module.exports = registerLeaderboardRoutes;
