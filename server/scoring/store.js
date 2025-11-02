const matchScores = new Map();
const userSummaries = new Map();

function recordScore({ matchId, userId, points, breakdown, calculatedAt }) {
  if (!matchId || !userId) {
    throw new Error('matchId and userId are required to record a score');
  }

  const timestamp = calculatedAt || new Date().toISOString();
  const scoreRecord = { matchId, userId, points, breakdown, calculatedAt: timestamp };

  let scoresForMatch = matchScores.get(matchId);
  if (!scoresForMatch) {
    scoresForMatch = new Map();
    matchScores.set(matchId, scoresForMatch);
  }

  const existing = scoresForMatch.get(userId);
  scoresForMatch.set(userId, scoreRecord);

  let summary = userSummaries.get(userId);
  if (!summary) {
    summary = {
      userId,
      totalPoints: 0,
      matchCount: 0,
      matches: new Map(),
      lastUpdatedAt: timestamp
    };
    userSummaries.set(userId, summary);
  }

  if (existing) {
    summary.totalPoints -= existing.points;
  } else {
    summary.matchCount += 1;
  }

  summary.totalPoints += points;
  summary.matches.set(matchId, scoreRecord);
  summary.lastUpdatedAt = timestamp;
}

function getLeaderboard(limit) {
  const entries = Array.from(userSummaries.values()).map((summary) => ({
    userId: summary.userId,
    totalPoints: summary.totalPoints,
    matchCount: summary.matchCount,
    lastUpdatedAt: summary.lastUpdatedAt
  }));

  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return a.userId.localeCompare(b.userId);
  });

  if (typeof limit === 'number') {
    return entries.slice(0, limit);
  }

  return entries;
}

function getUserHistory(userId) {
  const summary = userSummaries.get(userId);
  if (!summary) {
    return [];
  }
  return Array.from(summary.matches.values()).sort(
    (a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt)
  );
}

function getMatchScores(matchId) {
  const match = matchScores.get(matchId);
  if (!match) {
    return [];
  }
  return Array.from(match.values());
}

function clearScores() {
  matchScores.clear();
  userSummaries.clear();
}

module.exports = {
  recordScore,
  getLeaderboard,
  getUserHistory,
  getMatchScores,
  clearScores
};
