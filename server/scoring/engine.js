const defaultRules = {
  playerMatchPoints: 10,
  formationMatchPoints: 5,
  fullLineupBonus: 15
};

function unique(list) {
  return Array.from(new Set(list));
}

function createScoringEngine(rules = {}) {
  const mergedRules = { ...defaultRules, ...rules };

  function score(prediction, officialLineup) {
    if (!prediction || !officialLineup) {
      throw new Error('Prediction and official lineup are required to score');
    }

    const predictedPlayers = unique(prediction.players || []);
    const officialPlayers = unique(officialLineup.players || []);

    const matchedPlayers = predictedPlayers.filter((player) => officialPlayers.includes(player));
    const playerPoints = matchedPlayers.length * mergedRules.playerMatchPoints;

    let bonus = 0;

    if (
      mergedRules.formationMatchPoints > 0 &&
      prediction.formation &&
      officialLineup.formation &&
      prediction.formation === officialLineup.formation
    ) {
      bonus += mergedRules.formationMatchPoints;
    }

    const samePlayers =
      predictedPlayers.length === officialPlayers.length &&
      predictedPlayers.every((player) => officialPlayers.includes(player));

    if (samePlayers && mergedRules.fullLineupBonus > 0) {
      bonus += mergedRules.fullLineupBonus;
    }

    const totalPoints = playerPoints + bonus;

    return {
      points: totalPoints,
      breakdown: {
        matchedPlayers,
        playerPoints,
        bonus
      },
      rules: mergedRules
    };
  }

  return {
    score,
    getRules() {
      return { ...mergedRules };
    }
  };
}

module.exports = {
  createScoringEngine,
  defaultRules
};
